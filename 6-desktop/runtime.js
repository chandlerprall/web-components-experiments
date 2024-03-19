export class ConnectedNode {
  static getNode(value) {
    if (value instanceof HTMLElement) {
      return value;
    }
    return new Text(value);
  }

  #anchor = document.createComment('ConnectedNode anchor');
  #value = undefined;
  #valueNodes = [];

  constructor(value) {
    this.#value = value;
  }

  set value(newValue) {
    this.#value = newValue;
    this.#inject();
  }

  #removeValueNodes() {
    while (this.#valueNodes.length) {
      this.#valueNodes.pop().remove();
    }
  }

  #inject() {
    if (this.#anchor.parentNode == null) return;
    this.#removeValueNodes();

    const values = Array.isArray(this.#value) ? this.#value : [this.#value];

    let afterNode = this.#anchor;
    for (let i = 0; i < values.length; i++) {
      const valueNode = ConnectedNode.getNode(values[i]);
      this.#valueNodes.push(valueNode);
    }
    afterNode.after(...this.#valueNodes);
  }

  connect(targetElement, { replace } = {}) {
    this.disconnect();

    if (replace === true) {
      targetElement.replaceWith(this.#anchor);
    } else {
      targetElement.append(this.#anchor);
    }
    this.#inject();

    return this;
  }

  disconnect() {
    if (this.#anchor.parentNode != null) {
      this.#removeValueNodes();
      this.#anchor.remove();
    }
    return this;
  }
}

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

    // @TODO: watch for changes to `length`
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

export class Signal {
  #connectedNode = undefined;
  #element = undefined;
  #value = undefined;

  #isUpdating = false;
  #listeners = [];

  constructor(value, asElement = "span") {
    this.#value = value;
    this.#connectedNode = new ConnectedNode(value);

    Object.defineProperty(this, 'value', {
      get: () => this.#value,
      set: (newValue) => {
        if (this.#isUpdating) return;
        this.#isUpdating = true;

        this.#value = newValue;
        this.#connectedNode.value = newValue;

        for (let i = 0; i < this.#listeners.length; i++) {
          this.#listeners[i](newValue);
        }

        this.#isUpdating = false;
      }
    });
  }

  on(callback) {
    this.#listeners.push(callback);
  }

  off(callback) {
    this.#listeners = this.#listeners.filter(listener => listener !== callback);
  }

  as(callback) {
    const holder = new Signal(callback(this.#value));
    // @TODO: how to garbage collect this?
    this.on(nextValue => {
      const result = callback(nextValue);
      holder.value = result;
    })
    return holder;
  }

  with(otherSignal) {
    const holder = new Signal([this.#value, otherSignal.value]);
    const update = () => {
      holder.value = [this.#value, otherSignal.value];
    }
    // @TODO: how to garbage collect this?
    this.on(update);
    otherSignal.on(update);
    return holder;
  }

  connect(element, options) {
    this.disconnect();
    this.#connectedNode.connect(element, options);
  }

  disconnect() {
    this.#connectedNode.disconnect();
  }

  toString() {
    return this.#value?.toString();
  }
}

const domParser = new window.DOMParser();
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
  if (part instanceof Signal) {
    const id = uniqueId();
    idToValueMap[id] = part;
    if (attribute) {
      hydrations.push({ type: 'attribute', attribute, part, id });
      return `"${id}"`;
    } else {
      hydrations.push({ type: 'dom', part, id });
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
    if (attribute?.type === 'handler') {
      hydrations.push({ type: 'handler', part, id, eventName: attribute.name });
    }
    return `"${id}"`;
  } else if (part instanceof ComponentDefinition) {
    hydrations.push(part.hydrate);
    part = part.html;
  } else if (part instanceof HTMLElement) {
    const id = uniqueId();
    idToValueMap[id] = part;
    hydrations.push({ type: 'element', part, id });
    return `<data id="${id}"></data>`;
  } else if (Array.isArray(part)) {
    if (attribute) {
      const id = uniqueId();
      idToValueMap[id] = part;
      hydrations.push({ type: 'attribute', attribute, part, id });
      return `"${id}"`;
    } else {
      return part.map(part => processPart(part, attribute, hydrations)).join('');
    }
  } else if (attribute) {
    if (typeof part === 'boolean' || part === 'true' || part === 'false' || part == null) {
      const id = uniqueId();
      hydrations.push({ type: 'booleanattribute', attribute, part, id });
      return `"${id}"`;
    } else if (typeof part === 'object') {
      const id = uniqueId();
      idToValueMap[id] = part;
      hydrations.push({ type: 'attribute', attribute, part, id });
      return `"${id}"`;
    }
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
const definedElements = new Set();

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
    // @TODO: the fallbacks to owningElement to handle when handler is on the top-level node from element``,
    //  this means we're not 100% tied to the IDs
    for (const hydration of hydrations) {
      const { type } = hydration
      if (type === 'dom') {
        const { id, part } = hydration;
        const dataNode = (owningElement.shadowRoot ?? owningElement).querySelector(`[id="${id}"]`) ?? owningElement;
        part.connect(dataNode, { replace: true });
      } else if (type === 'element') {
        const { id, part } = hydration;
        const dataNode = (owningElement.shadowRoot ?? owningElement).querySelector(`[id="${id}"]`) ?? owningElement;
        dataNode.before(part);
        dataNode.remove();
      } else if (type === 'attribute') {
        const {id, attribute, part} = hydration;
        const element = (owningElement.shadowRoot ?? owningElement).querySelector(`[${attribute.name}="${id}"]`) ?? owningElement;
        const elementTagLower = element.tagName.toLowerCase();

        if (definedElements.has(elementTagLower)) {
          // element came from us and already has the attribute set to the id
        } else {
          // we are in charge of managing the attribute value
          const updateAttribute = () => {
            if (element.tagName === 'INPUT' && attribute.name === 'value') {
              element.value = part.value;
            } else {
              if (part.value === false || part.value == null) {
                element.removeAttribute(attribute.name);
              } else {
                element.setAttribute(attribute.name, part.value);
              }
            }
          }
          part.on(updateAttribute);
          updateAttribute();

          // if this element could be a custom element, when it's defined we may yield control of the attribute to the component itself
          if (elementTagLower.indexOf('-') !== -1) {
            customElements.whenDefined(elementTagLower).then(() => {
              if (definedElements.has(elementTagLower) === false) return; // don't swap out if we don't control the element
              part.off(updateAttribute);
              const id = uniqueId();
              idToValueMap[id] = part;
              element.setAttribute(attribute.name, id);
            });
          }
        }
      } else if (type === 'booleanattribute') {
        const {id, attribute, part} = hydration;
        const element = (owningElement.shadowRoot ?? owningElement).querySelector(`[${attribute.name}="${id}"]`) ?? owningElement;
        if (!part) {
          element.removeAttribute(attribute.name);
        } else {
          element.setAttribute(attribute.name, '');
        }
      } else if (type === 'attributemap') {
        // @TODO: garbage collection
        const { part: { [ATTRIBUTE_MAP]: publisher, ...part }, id } = hydration;
        const updateAttributes = () => {
          for (const attributeName in part) {
            const targetElement = owningElement.shadowRoot.querySelector(`[data-attribute-map="${id}"]`) ?? owningElement;
            targetElement.setAttribute(attributeName, part[attributeName].value);
          }
        };
        updateAttributes();
        publisher.on(() => updateAttributes());
      } else if (type === 'handler') {
        const { id, eventName, part } = hydration;
        const targetElement = (owningElement.shadowRoot ?? owningElement).querySelector(`[${eventName}="${id}"]`) ?? owningElement;
        targetElement.removeAttribute(eventName);
        targetElement.addEventListener(eventName.replace(/^on/, '').toLowerCase(), part);
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

const elementToContextMap = new WeakMap();
const getElementContext = (element) => {
  let elementContext;
  if (elementToContextMap.has(element)) {
    elementContext = elementToContextMap.get(element);
  } else {
    elementContext = {};
    elementToContextMap.set(element, elementContext);
  }
  return elementContext;
}

export function registerComponent(name, componentDefinition, BaseClass = HTMLElement) {
  definedElements.add(name);
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
    attributes = new Proxy(
      { [ATTRIBUTE_MAP]: new Signal(0) },
      {
        set: (target, key, value) => {
          if (value instanceof Signal) {
            target[key] = value;
          } else {
            target[key].value = value;
          }

          target[ATTRIBUTE_MAP].value++;

          return true;
        },
        get: (target, key) => {
          if (key in target === false) {
            target[key] = new Signal();
          }
          return target[key];
        }
      }
    );

    refs = {};

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

      this.#initialize();
    }

    #attachAttribute(attributeName, value, oldValue) {
      if (!this.attributes.hasOwnProperty(attributeName)) {
        this.attributes[attributeName] = new Signal();
      }

      if (value?.match(/^_unique_id_\d+/)) {
        // @TODO: garbage collection (call off on component disconnectedCallback?)
        const data = idToValueMap[value];

        if (data instanceof Signal) {
          data.on(nextValue => {
            this.attributes[attributeName] = nextValue;
          });
          this.attributes[attributeName].on(nextValue => {
            data.value = nextValue;
          });
          this.attributes[attributeName].value = data.value;
        } else {
          this.attributes[attributeName].value = data;
        }
      } else {
        this.attributes[attributeName].value = value;
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
        const element = this;

        const context = new Proxy({}, {
          get(target, key) {
            let currentElement = element.parentElement;
            while (currentElement) {
              const elementContext = getElementContext(currentElement);
              if (elementContext[key] !== undefined) {
                return elementContext[key];
              }
              currentElement = currentElement.parentElement;
            }
          },

          set(target, key, value) {
            getElementContext(element)[key] = value;
            return true;
          }
        });

        // @TODO: alert component definition on unmount
        componentDefinition({
          element: this,
          render: (...args) => {
            const { html, hydrate } = render(...args);
            this.shadowRoot.innerHTML = html;
            hydrate(this);

            // bind elements to refs
            // @TODO: this doesn't catch dom changes, should we use a mutation observer
            const elementsWithIds = this.shadowRoot.querySelectorAll('[id]');
            for (let i = 0; i < elementsWithIds.length; i++) {
              const element = elementsWithIds[i];
              const id = element.id;
              this.refs[id] = element;
            }
          },
          refs: this.refs,
          attributes: this.attributes,
          context,
        });
      }
    }

    emit(eventName, detail) {
      return this.dispatchEvent(new CustomEvent(`${name}-${eventName}`, {
        composed: true,
        bubbles: true,
        cancelable: true,
        detail,
      }));
    }
  };
  Object.defineProperty(ComponentClass, 'name', { value: name });
  customElements.define(name, ComponentClass);
}
