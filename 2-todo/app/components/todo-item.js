customElements.define('todo-item', class TodoItem extends BaseTodoItemElement {
  static observedAttributes = ['done'];

  get isChecked() {
    return this.getAttribute("done") != null;
  }

  constructor() {
    super();

    const id = Math.random();
    this.shadowRoot.querySelector('input[type=checkbox]').setAttribute('id', id);
    this.shadowRoot.querySelector('label').setAttribute('for', id);

    this.shadowRoot.querySelector('input[type=checkbox]').addEventListener("change", () => {
      this.#syncElements();
      this.dispatchEvent(new CustomEvent("todo-item-toggle", {
        composed: true,
        bubbles: true,
        cancelable: false,
        detail: {
          checked: !this.isChecked,
        },
      }));
    });
    this.#syncElements();
  }

  #syncElements() {
    this.shadowRoot.querySelector('input[type=checkbox]').checked = this.isChecked;
  }

  attributeChangedCallback() {
    this.#syncElements();
  }
});