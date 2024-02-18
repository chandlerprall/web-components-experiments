import { registerComponent } from 'runtime';

registerComponent('notepad-app', ({ render }) => {
render`
<style>
:host {
  height: inherit;
  width: inherit;
}
textarea {
  height: 100%;
  width: 100%;
  box-sizing: border-box;
}
</style>

<textarea></textarea>`;
});