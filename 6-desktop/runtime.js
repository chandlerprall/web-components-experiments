export class ContainedNodeArray extends Array {
  connectedElement = null;

  connect(element, { replace } = {}) {
    this.disconnect();

    if (replace) {
      this.connectedElement = element.parentNode;
    } else {
      this.connectedElement = element
    }

    if (replace) {
      element.after(...this);
      element.remove();
    } else {
      this.connectedElement.append(...this);
    }
  }

  disconnect() {
    for (let i = 0; i < this.length; i++) {
      const node = this[i];
      node.remove();
    }
  }

  push(...nodes) {
    const result = super.push(...nodes);
    this.connectedElement?.append(...nodes);
    return result;
  }

  slice() {
    throw new Error('unimplemented');
  }

  splice(start, deleteCount, ...items) {
    const removedElements = super.splice(start, deleteCount, ...items);

    if (this.connectedElement) {
      for (let i = 0; i < removedElements.length; i++) {
        this.connectedElement.removeChild(removedElements[i]);
      }

      // @TODO: if this ContainedNodeArray is empty and the connectedElement has other children,
      // this can insert element in the wrong place
      if (this.connectedElement.children.length === 0 || start === 0) {
        this.connectedElement.append(...items);
      } else {
        this[start - 1].after(...items);
      }
    }
  }

  unshift() {
    throw new Error('unimplemented');
  }

  pop() {
    throw new Error('unimplemented');
  }
}

export class State {
  connectedElement = null;

  #element = undefined;
  #value = undefined;

  #isUpdating = false;
  #listeners = [];

  constructor(value, asElement = "span") {
    this.#value = value;
    this.#element = document.createElement(asElement);
    this.#element.innerText = value;

    Object.defineProperty(this, 'value', {
      get: () => this.#value,
      set: (newValue) => {
        if (this.#isUpdating) return;
        this.#isUpdating = true;

        this.#value = newValue;
        this.#element.innerText = newValue;

        for (let i = 0; i < this.#listeners.length; i++) {
          this.#listeners[i](newValue);
        }

        this.#isUpdating = false;
      }
    });
  }

  onUpdate(callback) {
    this.#listeners.push(callback);
  }

  offUpdate(callback) {
    this.#listeners = this.#listeners.filter(listener => listener !== callback);
  }

  connect(element, { replace } = {}) {
    this.disconnect();

    if (replace) {
      this.connectedElement = element.parentNode;
    } else {
      this.connectedElement = element
    }

    if (replace) {
      element.after(this.#element);
      element.remove();
    } else {
      this.connectedElement.append(this.#element);
    }
  }

  disconnect() {
    this.#element.parentNode?.removeChild(node);
  }

  toString() {
    return this.#value?.toString();
  }
}

const domParser = new DOMParser();
export const html = (...args) => {
  const { html, hydrate } = render(...args);
  const document = domParser.parseFromString(html, 'text/html');
  hydrate(document.body);
  return new ContainedNodeArray(...document.body.childNodes);
}

let _id = 0;
const uniqueId = () => {
  return `_unique_id_${_id++}`;
}

function processPart(part, attribute, hydrations) {
  if (part instanceof State) {
    const id = uniqueId();
    idToValueMap[id] = part;
    if (attribute) {
      hydrations.push({type: 'attribute', attribute, part, id});
      return `"${id}"`;
    } else {
      hydrations.push({type: 'dom', part, id});
      return `<data id="${id}"></data>`;
    }
  } else if (part && typeof part === 'object' && ATTRIBUTE_MAP in part) {
    const id = uniqueId();
    hydrations.push({ type: 'attributemap', part, id });
    return `data-attribute-map=${id}`;
  } else if (part instanceof ContainedNodeArray) {
    const id = uniqueId();
    idToValueMap[id] = part;
    hydrations.push({ type: 'dom', part, id });
    return `<data id="${id}"></data>`;
  } else if (part instanceof Function) {
    const id = uniqueId();
    globalThis[id] = part;
    return attribute?.type === 'handler' ? `${id}(...arguments)` : id;
  } else if (part instanceof ComponentDefinition) {
    hydrations.push(part.hydrate);
    part = part.html;
  } else if (part instanceof HTMLElement) {
    const id = uniqueId();
    idToValueMap[id] = part;
    hydrations.push({ type: 'element', part, id });
    return `<data id="${id}"></data>`;
  } else if (Array.isArray(part)) {
    return part.map(part => processPart(part, attribute, hydrations)).join('');
  } else if (attribute) {
    return `"${part}"`;
  }
  return part;
}

class ComponentDefinition {
  constructor(html, hydrate) {
    this.html = html;
    this.hydrate = hydrate;
  }
}

function getAttributeForExpression(prevString) {
  if (prevString.at(-1) !== '=') return null;

  let attribute = '';
  for (let i = prevString.length - 2; i >= 0; i--) {
    const char = prevString.at(i);
    if (char.match(/\S/)) {
      attribute = char + attribute;
    } else {
      break;
    }
  }

  return {
    name: attribute,
    type: attribute.startsWith('on') ? 'handler' : 'attribute',
  };
}

const ATTRIBUTE_MAP = Symbol('attribute map');
const CREATED_ELEMENT = Symbol('created element');

const idToValueMap = {};
window.idToValueMap = idToValueMap;

const render = (strings = [''], ...rest) => {
  const hydrations = [];
  const allParts = [...strings];

  for (let i = 0; i < rest.length; i++) {
    const attribute = getAttributeForExpression(strings[i]);
    const part = processPart(rest[i], attribute, hydrations);
    allParts.splice(i * 2 + 1, 0, part);
  }
  const lines = allParts.join('').split(/[\r\n]+/g);
  for (let i = 0; i < lines.length; i++) {
    lines[i] = lines[i].trim();
  }

  const html = lines.join('\n');
  const hydrate = (owningElement) => {
    for (const hydration of hydrations) {
      const { type } = hydration
      if (type === 'dom') {
        const { id, part } = hydration;
        const dataNode = owningElement.shadowRoot.querySelector(`[id="${id}"]`);
        part.connect(dataNode, { replace: true });
      } else if (type === 'element') {
        const { id, part } = hydration;
        const dataNode = (owningElement.shadowRoot ?? owningElement).querySelector(`[id="${id}"]`);
        dataNode.before(part);
        dataNode.remove();
      } else if (type === 'attribute') {
        const { id, attribute, part } = hydration;
        const element = owningElement.shadowRoot.querySelector(`[${attribute.name}="${id}"]`);

        if (element[CREATED_ELEMENT]) {
          // element came from us and already has the attribute set to the id
        } else {
          // we are in charge of managing the attribute value
          const updateAttribute = () => {
            if (element.tagName === 'INPUT' && attribute.name === 'value') {
              element.value = part.value;
            } else {
              element.setAttribute(attribute.name, part.value);
            }
          }
          part.onUpdate(updateAttribute);
          updateAttribute();
        }
      } else if (type === 'attributemap') {
        // @TODO: garbage collection
        const { part: { [ATTRIBUTE_MAP]: publisher, ...part }, id } = hydration;
        const updateAttributes = () => {
          for (const attributeName in part) {
            const targetElement = owningElement.shadowRoot.querySelector(`[data-attribute-map="${id}"]`);
            targetElement.setAttribute(attributeName, part[attributeName].value);
          }
        };
        updateAttributes();
        publisher.onUpdate(() => updateAttributes());
      }
    }
  };

  return new ComponentDefinition(html, hydrate);
}

export const element = (...args) => {
  const { html, hydrate } = render(...args);

  const document = domParser.parseFromString(html, 'text/html');
  const element = document.body.childNodes[0];
  hydrate(element);
  return element;
}

export function registerComponent(name, componentDefinition, BaseClass = HTMLElement) {
  const isComponentString = typeof componentDefinition === 'string';
  const isComponentFunction = componentDefinition instanceof Function;

  isComponentString
    ? component
        .split(/[\r\n]+/g)
        .map(line => line.trim())
        .join('\n')
    : '';

  const template = document.createElement('template');
  template.innerHTML = html;

  const ComponentClass = class extends BaseClass {
    [CREATED_ELEMENT] = true;

    #attributes = new Proxy(
      { [ATTRIBUTE_MAP]: new State(0) },
      {
        set: (target, key, value) => {
          if (value instanceof State) {
            target[key] = value;
          } else {
            target[key].value = value;
          }

          target[ATTRIBUTE_MAP].value++;

          return true;
        },
        get: (target, key) => {
          return target[key];
        }
      }
    );

    #refs = {};

    constructor() {
      super();

      for (const attributeName of this.getAttributeNames()) {
        if (attributeName.startsWith('on')) continue;
        const attributeValue = this.getAttribute(attributeName);
        this.#attachAttribute(attributeName, attributeValue);
      }

      const mutationObserver = new MutationObserver((mutations) => {
        for (let i = 0; i < mutations.length; i++) {
          const mutation = mutations[i];
          if (mutation.type !== 'attributes') continue;
          const { attributeName, oldValue } = mutation;
          const value = this.getAttribute(attributeName);
          this.#attachAttribute(attributeName, value, oldValue);
        }
      });
      mutationObserver.observe(this, { attributes: true, attributeOldValue: true });

      const shadowRoot = this.attachShadow({
        mode: 'open'
      });
      shadowRoot.appendChild(template.content.cloneNode(true));

      queueMicrotask(this.#initialize.bind(this));
    }

    #attachAttribute(attributeName, value, oldValue) {
      if (!this.#attributes.hasOwnProperty(attributeName)) {
        this.#attributes[attributeName] = new State();
      }

      if (value?.match(/^_unique_id_\d+/)) {
        // @TODO: garbage collection (call offUpdate on component disconnectedCallback?)
        const data = idToValueMap[value];
        data.onUpdate(nextValue => {
          this.#attributes[attributeName] = nextValue;
        });
        this.#attributes[attributeName].onUpdate(nextValue => {
          data.value = nextValue;
        });

        this.#attributes[attributeName].value = data.value;
      } else {
        this.#attributes[attributeName].value = value;
      }
    }

    #initialize() {
      // bind data nodes
      const dataNodes = Array.from(this.shadowRoot.querySelectorAll('data[value]'));
      for (let i = 0; i < dataNodes.length; i++) {
        const dataName = dataNodes[i].getAttribute('value');
        this[dataName].connect(dataNodes[i], { replace: true });
      }

      // run component definition
      if (isComponentFunction) {
        // @TODO: alert component definition on unmount
        componentDefinition({
          element: this,
          render: (...args) => {
            const { html, hydrate } = render(...args);
            this.shadowRoot.innerHTML = html;
            hydrate(this);

            // bind elements to refs
            const elementsWithIds = this.shadowRoot.querySelectorAll('[id]');
            for (let i = 0; i < elementsWithIds.length; i++) {
              const element = elementsWithIds[i];
              const id = element.id;
              this.#refs[id] = element;
            }
          },
          refs: this.#refs,
          attributes: this.#attributes,
        });
      }
    }

    emit(eventName, detail) {
      this.dispatchEvent(new CustomEvent(`${name}-${eventName}`, {
        composed: true,
        bubbles: true,
        cancelable: false,
        detail,
      }));
    }
  };
  Object.defineProperty(ComponentClass, 'name', { value: name });
  customElements.define(name, ComponentClass);
}
