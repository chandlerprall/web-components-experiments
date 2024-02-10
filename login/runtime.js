class ContainedNodeArray extends Array {
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
      node.parentNode?.removeChild(node);
    }
  }

  push(...nodes) {
    const result = super.push(...nodes);
    this.connectedElement?.append(...nodes);
    return result;
  }

  splice() {
    throw new Error('unimplemented');
  }

  splice() {
    throw new Error('unimplemented');
  }

  unshift() {
    throw new Error('unimplemented');
  }

  pop() {
    throw new Error('unimplemented');
  }
}

class DataConnection {
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
const html = (strings, ...rest) => {
  const allParts = [...strings];
  for (let i = 0; i < rest.length; i++) {
    allParts.splice(i * 2 + 1, 0, rest[i]);
  }
  const lines = allParts.join('').split(/[\r\n]+/g);
  for (let i = 0; i < lines.length; i++) {
    lines[i] = lines[i].trim();
  }

  const document = domParser.parseFromString(lines.join('\n'), 'text/html');
  const children = document.body.children;

  return new ContainedNodeArray(...children);
}

let _id = 0;
const uniqueId = () => {
  return `_unique_id_${_id++}`;
}

function processPart(part, attribute, hydrations) {
  if (part instanceof DataConnection) {
    const id = uniqueId();
    idToValueMap[id] = part;
    if (attribute) {
      hydrations.push({ type: 'attribute', attribute, part, id });
      return `"${id}"`;
    } else {
      hydrations.push({ type: 'dom', part, id });
      return `<data id="${id}"></data>`;
    }
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
  } else if (Array.isArray(part)) {
    return part.map(part => processPart(part, hydrations)).join('');
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

const CREATED_ELEMENT = Symbol('created element');
const idToValueMap = {};

const component = (strings, ...rest) => {
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
  const hydrate = (parent) => {
    for (const hydration of hydrations) {
      const { type } = hydration
      if (type === 'dom') {
        const { id, part } = hydration;
        const dataNode = parent.querySelector(`[id="${id}"]`);
        part.connect(dataNode, { replace: true });
      } else if (type === 'attribute') {
        const { id, attribute, part } = hydration;
        const element = parent.querySelector(`[${attribute.name}="${id}"]`);

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
      }
    }
  };

  return new ComponentDefinition(html, hydrate);
}

function loadComponent(name) {
  const htmlPath = `./components/${name}.html`;
  const cssPath = `./components/${name}.css`;
  const jsPath = `./components/${name}.js`;

  const resultPromise = new Promise(async (resolve, reject) => {
    const htmlFetch = fetch(htmlPath, { mode: 'no-cors' });
    const cssFetch = fetch(cssPath, { mode: 'no-cors' });

    const [htmlResult, cssResult] = await Promise.allSettled([htmlFetch, cssFetch]);
    if (htmlResult.status === "rejected") {
      reject(new Error(`Could not load HTML for ${name}: ${htmlResult.reason}`));
    }

    const hasCss = cssResult.status === "fulfilled";

    const html = (await htmlResult.value.text())
      .split(/[\r\n]+/g)
      .map(line => line.trim())
      .join('\n');
    const css = hasCss ? await cssResult.value.text() : null;

    const template = document.createElement('template');
    template.innerHTML = `${hasCss ? `<style>${css}</style>` : ''}${html}`;
    const [, templateScript] = html.match(/^<script>(.*?)<\/script>/s) ?? [];

    const ComponentClass = class extends HTMLElement {
      #attributes = {};
      [CREATED_ELEMENT] = true;

      attributeChangedCallback(name, oldValue, newValue) {
        if (newValue?.match(/^_unique_id_\d+/)) {
          // @TODO: if oldValue is a unique id match, disconnect it
          // @TODO: garbage collection (call offUpdate on component disconnectedCallback?)
          const data = idToValueMap[newValue];
          data.onUpdate(nextValue => {
            this.#attributes[name].value = nextValue;
          });
          this.#attributes[name].onUpdate(nextValue => {
            data.value = nextValue;
          });

          this.#attributes[name].value = data.value;
        } else {
          this.#attributes[name].value = newValue;
        }
      }

      constructor() {
        super();

        const observedAttributes = this.constructor.observedAttributes ?? [];
        for (let i = 0; i < observedAttributes.length; i++) {
          const attributeName = observedAttributes[i];
          this.#attributes[attributeName] = new DataConnection(this.getAttribute(attributeName));
        }

        const shadowRoot = this.attachShadow({
          mode: 'open'
        });
        shadowRoot.appendChild(template.content.cloneNode(true));

        Object.defineProperty(
          this,
          'html',
          {
            set({ html, hydrate }) {
              shadowRoot.innerHTML = `${hasCss ? `<style>${css}</style>` : ''}${html}`;
              hydrate(shadowRoot);
            }
          }
        )

        queueMicrotask(this.#initialize.bind(this));
      }

      #initialize() {
        // bind data nodes
        const dataNodes = Array.from(this.shadowRoot.querySelectorAll('data[value]'));
        for (let i = 0; i < dataNodes.length; i++) {
          const dataName = dataNodes[i].getAttribute('value');
          this[dataName].connect(dataNodes[i], { replace: true });
        }

        // run script
        if (templateScript) {
          const script = new Function('attributes', templateScript);
          script.call(this, this.#attributes);
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

    Object.defineProperty(globalThis, `Base${kebabCasetoCamelCase(name)}Element`, { value: ComponentClass });

    const script = document.createElement('script');
    script.src = jsPath;
    script.onload = () => {
      // assume js defined the component
      resolve();
    }
    script.onerror = (e) => {
      // no custom js, define ourselves
      customElements.define(name, ComponentClass);
      resolve();
    }
    document.body.appendChild(script);
  });

  return resultPromise;
}

async function loadComponents(...names) {
  for (let i = 0; i < names.length; i++) {
    const name = names[i];
    await loadComponent(name);
  }
}

function kebabCasetoCamelCase(input) {
  return input.replace(/(^|-)([a-z])/g, (char) => { return char[char.length - 1].toUpperCase(); });
}
