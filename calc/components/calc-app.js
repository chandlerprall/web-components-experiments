customElements.define('calc-app', class MyApp extends BaseCalcAppElement {
  input = new DataConnection('0');
  equation = new DataConnection('');
  answer = new DataConnection('');

  constructor() {
    super();
  }
});