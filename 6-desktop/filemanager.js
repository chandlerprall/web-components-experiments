import { html, element, State } from 'runtime';
import * as Pad from './components/desktop-app.js';

const liveViews = [];

class File {
	name = null;
	directory = null;
	content = null;
	icon = null;

	constructor(name, content, icon = '📄') {
		this.name = name;
		this.content = content;
		this.icon = icon;
	}
}

class Directory {
	name = null;
	parent = null;

	directories = [];
	files = [];

	constructor(name) {
		this.name = name;
	}

	addDirectory(directory) {
		directory.parent = this;
		this.directories.push(directory);
		return directory;
	}

	addFile(file) {
		file.directory = this;
		this.files.push(file);
		return file;
	}
}
const root = new Directory('');
const utils = root.addDirectory(new Directory('utils'));
utils.addFile(new File("Calculator.app", null, '🧮'));
utils.addFile(new File("Notepad.app", null, '📝'));
utils.addFile(new File("Files.app", null, '🗂️'));
root.addFile(new File("README.txt", "This is a readme file"));

export const modals = html();

export const openFileDialog = () => {
	return new Promise(resolve => {
		const closeDialog = (result) => {
			const dialogIdx = modals.indexOf(dialog);
			modals.splice(dialogIdx, 1);
			resolve(result);
		}

		const dialog = element`
			<modal-dialog>
				<strong>Select file</strong>
				
				<select size="5">
					<option>quick_brown_fox</option>
					<option>Two</option>
				</select>
				
				
				<button slot="buttons" onclick=${() => closeDialog(null)}>Close</button>
				<button slot="buttons" onclick=${() => closeDialog(dialog.querySelector('select').value)}>Open</button>
			</modal-dialog>
		`;
		dialog.style.width = '300px';
		modals.push(dialog);
	});
};

export const openSaveDialog = () => {
	return new Promise(resolve => {
		const closeDialog = (result) => {
			const dialogIdx = modals.indexOf(dialog);
			modals.splice(dialogIdx, 1);
			resolve(result);
		}

		const dialog = element`
			<modal-dialog>
				<strong>Save file</strong>
				
				<button slot="buttons" onclick=${() => closeDialog(false)}>Cancel</button>
				<button slot="buttons" onclick=${() => closeDialog(true)}>Save</button>
			</modal-dialog>
		`;
		dialog.style.width = '300px';
		modals.push(dialog);
	});
};

export class LiveView {
	path = null;
	directories = new State([]);
	files = new State([]);

	constructor(path) {
		this.path = path;
		liveViews.push(this);
		this.refresh();
	}

	close() {
		const idx = liveViews.indexOf(this);
		liveViews.splice(idx, 1);
	}

	refresh() {
		const parts = this.path.split('/');
		parts.shift(); // remove root
		let directory = root;
		while (parts.length) {
			const part = parts.shift();
			if (part === '..') {
				directory = directory.parent;
			} else if (part !== '.') {
				directory = directory.directories.find(d => d.name === part);
			}
		}

		if (!directory) {
			this.directories.value = [];
			this.files.value = [];
		} else {
			this.directories.value = [...directory.directories];
			this.files.value = [...directory.files];
		}
	}

	navigate(path) {
		this.path = path;
		this.refresh();
	}
}

export function openFile(file) {
	// mime types? Where we're going, we don't need mime types
	if (file.name.endsWith('.txt')) {
		Pad.launchNotepad(file);
	} else if (file.name.endsWith('.app')) {
		Pad[`launch${file.name.replace('.app', '')}`]();
	}
}
