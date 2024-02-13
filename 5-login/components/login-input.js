customElements.define('login-input', class LoginInput extends BaseLoginInputElement {
  static observedAttributes = ["value", "type", "placeholder"];
});