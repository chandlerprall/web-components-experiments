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

    const html = await htmlResult.value.text();
    const css = hasCss ? await cssResult.value.text() : null;

    const template = document.createElement('template');
    template.innerHTML = `${hasCss ? `<style>${css}</style>` : ''}${html}`;

    const ComponentClass = class extends HTMLElement {
      constructor() {
        super();

        const shadowRoot = this.attachShadow({
          mode: 'open'
        });
        shadowRoot.appendChild(template.content.cloneNode(true));

        queueMicrotask(this.initialize.bind(this));
      }

      initialize() {
        const dataNodes = Array.from(this.shadowRoot.querySelectorAll('data[value]'));
        for (let i = 0; i < dataNodes.length; i++) {
          const dataName = dataNodes[i].getAttribute('value');
          this[dataName].connect(dataNodes[i], { replace: true });
        }
      }
    };
    Object.defineProperty(ComponentClass, 'name', { value: name });

    Object.defineProperty(window, `Base${kebabCasetoCamelCase(name)}Element`, { value: ComponentClass });

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