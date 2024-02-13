customElements.define('my-app', class MyApp extends BaseMyAppElement {
  items = html`
    <todo-item>First</todo-item>
    <todo-item done>Second</todo-item>
  `;

  constructor() {
    super();

    const todoList = this.shadowRoot.querySelector('todo-list');
    todoList.addEventListener("todo-item-toggle", (e) => {
      if (e.detail.checked) {
        e.target.setAttribute("done", "");
      } else {
        e.target.removeAttribute("done");
      }
    });

    todoList.addEventListener("todo-list-item-added", (e) => {
      if (this.items.length >= 5) {
        e.preventDefault();
      } else {
        const el = html`<todo-item>${e.detail.item}</todo-item>`;
        this.items.push(...el);
      }
    });
  }
});