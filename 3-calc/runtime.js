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

  #listeners = [];

  constructor(value, asElement = "span") {
    this.#value = value;
    this.#element = document.createElement(asElement);
    this.#element.innerText = value;

    Object.defineProperty(this, 'value', {
      get: () => this.#value,
      set: (newValue) => {
        this.#value = newValue;
        this.#element.innerText = newValue;
        for (let i = 0; i < this.#listeners.length; i++) {
          this.#listeners[i](newValue);
        }
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

  const document = domParser.parseFromString(lines.join(''), 'text/html');
  const children = document.body.children;

  return new ContainedNodeArray(...children);
}

let _id = 0;
const uniqueId = () => {
  return `_unique_id_${_id++}`;
}

function processPart(part, hydrations) {
  if (part instanceof DataConnection) {
    const id = uniqueId();
    hydrations.push({ type: 'data', part, id });
    return `<data id="${id}"></data>`;
  } else if (part instanceof ContainedNodeArray) {
    const id = uniqueId();
    hydrations.push({ type: 'data', part, id });
    return `<data id="${id}"></data>`;
  } else if (part instanceof Function) {
    const id = uniqueId();
    globalThis[id] = part;
    return `${id}(...arguments);`
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
const component = (strings, ...rest) => {
  const hydrations = [];
  const allParts = [...strings];

  for (let i = 0; i < rest.length; i++) {
    const part = processPart(rest[i], hydrations);
    allParts.splice(i * 2 + 1, 0, part);
  }
  const lines = allParts.join('').split(/[\r\n]+/g);
  for (let i = 0; i < lines.length; i++) {
    lines[i] = lines[i].trim();
  }

  const html = lines.join('');
  const hydrate = (parent) => {
    for (const hydration of hydrations) {
      const { type } = hydration
      if (type === 'data') {
        const { id, part } = hydration;
        const dataNode = parent.querySelector(`[id="${id}"]`);
        part.connect(dataNode, { replace: true });
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
      .join('');
    const css = hasCss ? await cssResult.value.text() : null;

    const template = document.createElement('template');
    template.innerHTML = `${hasCss ? `<style>${css}</style>` : ''}${html}`;
    const [, templateScript] = html.match(/^<script>(.*?)<\/script>/) ?? [];

    const ComponentClass = class extends HTMLElement {
      constructor() {
        super();

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
          const script = new Function(templateScript);
          script.call(this);
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
