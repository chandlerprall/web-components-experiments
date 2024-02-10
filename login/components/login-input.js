customElements.define('login-input', class LoginInput extends BaseLoginInputElement {
	value = new DataConnection('');
	type = new DataConnection('text');

	static observedAttributes = ["value", "type"];
});