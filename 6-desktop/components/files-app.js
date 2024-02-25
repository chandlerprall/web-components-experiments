import { registerComponent } from 'runtime';
import { readFile } from '../filemanager.js';

registerComponent('files-app', ({ render, element }) => {

element.addEventListener('file-explorer-dblclick-file', ({ detail: file }) => readFile(file));

render`
<file-explorer></file-explorer>
	`;
});
