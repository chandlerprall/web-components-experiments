import { registerComponent } from 'runtime';
import { openFileDialog, openSaveDialog, writeFile } from '../filemanager.js';

registerComponent('notepad-app', ({ render, refs, attributes }) => {
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
		
		<button slot="menu" onclick=${() => refs.content.value = ''}>New</button>
		<button slot="menu" onclick=${async () => {
			const file = await openFileDialog({ filter: '.txt' });
			if (file) refs.content.value = file.content;
		}}>Open</button>
		<button slot="menu" onclick=${() => {
			openSaveDialog().then(filepath => {
				writeFile(filepath.endsWith('.txt') ? filepath : `${filepath}.txt`, refs.content.value);
			})
		}}>Save</button>
	</popover-menu>
</menu-bar>
<textarea id="content"></textarea>`;

refs.content.value = attributes.file?.value?.content || '';
});
