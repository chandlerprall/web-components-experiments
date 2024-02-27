import { registerComponent } from 'runtime';
import { openFileDialog, openSaveDialog, writeFile } from '../filemanager.js';

registerComponent('notepad-app', ({ render, refs, attributes }) => {
render`
<style>
:host {
	display: flex;
	flex-direction: column;
  height: 100%;
  width: 100%;
}
textarea {
  flex-basis: 100%;
  box-sizing: border-box;
  resize: none;
}

menu-bar {
	flex-basis: var(--menubar-height, 25px);
}

.menuButton {
	border: 0;
	height: 100%;
	
	&:hover {
		filter: brightness(1.05);
	}
}
</style>

<menu-bar>
	<popover-menu>
		<button class="menuButton">File</button>
		
		<button slot="menu" onClick=${() => refs.content.value = ''}>New</button>
		<button slot="menu" onClick=${async () => {
			const file = await openFileDialog({ filter: '.txt' });
			if (file) refs.content.value = file.content;
		}}>Open</button>
		<button slot="menu" onClick=${() => {
			openSaveDialog().then(filepath => {
				if (filepath) {
					writeFile(filepath.endsWith('.txt') ? filepath : `${filepath}.txt`, refs.content.value);	
				}
			})
		}}>Save</button>
	</popover-menu>
</menu-bar>
<textarea id="content"></textarea>`;

refs.content.value = attributes.file?.value?.content || '';

globalThis.queueMicrotask(() => refs.content.focus());
});
