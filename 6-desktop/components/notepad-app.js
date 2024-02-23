import { registerComponent } from 'runtime';
import { openFileDialog, openSaveDialog } from '../filemanager.js';

registerComponent('notepad-app', ({ render, refs }) => {
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
			const content = await openFileDialog();
			if (content != null) refs.content.value = content;
		}}>Open</button>
		<button slot="menu" onclick=${() => openSaveDialog()}>Save</button>
	</popover-menu>
</menu-bar>
<textarea id="content"></textarea>`;
});
