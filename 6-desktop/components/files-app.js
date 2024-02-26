import { registerComponent } from 'runtime';
import { openFile } from '../filemanager.js';

registerComponent('files-app', ({ render, element, attributes }) => {

element.addEventListener('file-explorer-dblclick-file', ({ detail: file }) => openFile(file));

render`
<style>
file-explorer {
	height: 100%;
}
</style>
<file-explorer initialpath=${attributes?.initialpath || '/'}></file-explorer>
	`;
});
