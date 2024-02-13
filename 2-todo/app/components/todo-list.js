customElements.define('todo-list', class TodoList extends BaseTodoListElement {
  constructor() {
    super();

    this.#validateChildren(this.shadowRoot);

    const btn = this.shadowRoot.querySelector('[part=addItemButton]');
    const input = this.shadowRoot.querySelector('[part=addItemInput]');
    btn.addEventListener('slotchange', (e) => {
      const hasNodes = e.target.assignedNodes().length > 0;
      if (hasNodes) {
        btn.setAttribute('show', '');
      } else {
        btn.removeAttribute('show');
      }
    });

    btn.addEventListener('click', () => {
      btn.removeAttribute('show');
      input.setAttribute('show', '');
      input.focus();
    });

    input.addEventListener('keyup', (e) => {
      if (e.key === "Escape") {
        btn.setAttribute('show', '');
        input.removeAttribute('show');
      } else if (e.key === "Enter") {
        if (input.checkValidity()) {
          const event = new CustomEvent('todo-list-item-added', {
            composed: true,
            bubbles: true,
            cancelable: true,
            detail: {
              item: input.value
            },
          });
          this.dispatchEvent(event);

          if (!event.defaultPrevented) {
            btn.setAttribute('show', '');
            input.removeAttribute('show');
            input.value = "";
          }
        }
      }
    });
  }

  #validateChildren(root) {
    const todoNodes = root.querySelector('slot:not([name])').assignedNodes();
    todoNodes.forEach(node => {
      if (node.nodeName === "#text") {
        node.parentNode.removeChild(node);
      } else if (node.nodeName !== 'TODO-ITEM') {
        throw new Error(`Invalid child node ${node.nodeName} provided to todo-list's todo slot, expected only todo-item`);
      }
    });
  }
});