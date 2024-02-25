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
const desktop = root.addDirectory(new Directory('desktop'));
desktop.addFile(new File("Calculator.app", null, '🧮'));
desktop.addFile(new File("Notepad.app", null, '📝'));
desktop.addFile(new File("Files.app", null, '🗂️'));
root.addFile(new File("README.txt", "This is a readme file"));

export const modals = html();

export const openFileDialog = ({ filter }) => {
	return new Promise(resolve => {
		const closeDialog = (result) => {
			const dialogIdx = modals.indexOf(dialog);
			modals.splice(dialogIdx, 1);
			resolve(result);
		}

		const selectedFile = new State(null);
		const isOpenDisabled = new State(true);
		selectedFile.onUpdate(file => {
			isOpenDisabled.value = !file;
		});

		const dialog = element`
			<modal-dialog>
				<style>
					.filemanager-fileexplorer {
						height: 200px;
					}
				</style>
				<strong>Select file</strong>
				
				<file-explorer class="filemanager-fileexplorer" view="list" filter=${filter ?? ''}></file-explorer>
				
				<button slot="buttons" onclick=${() => closeDialog(null)}>Close</button>
				<button slot="buttons"
					disabled=${isOpenDisabled}
					onclick=${() => closeDialog(selectedFile.value)}
				>Open</button>
			</modal-dialog>
		`;
		dialog.style.width = '300px';
		dialog.addEventListener('file-explorer-select-file', ({ detail: file }) => selectedFile.value = file);
		dialog.addEventListener('file-explorer-dblclick-file', ({ detail: file }) => closeDialog(file));

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

		const filename = new State('');
		const isSaveDisabled = new State(true);
		filename.onUpdate(filename => {
			isSaveDisabled.value = !filename;
		});

		const dialog = element`
			<modal-dialog>
				<style>
					.filemanager-fileexplorer {
						height: 200px;
					}
					
					.filemanager-filename {
						border: 1px solid var(--token-color-border);
						height: 1.5em;
					}
				</style>
				<strong>Save file</strong>
				
				<file-explorer class="filemanager-fileexplorer" view="list"></file-explorer>
				<input
					class="filemanager-filename"
					placeholder="filename"
					value=${filename}
					onkeyup=${e => {
						filename.value = e.target.value;	
					}}
				/>
				
				<button slot="buttons" onclick=${() => closeDialog(null)}>Cancel</button>
				<button slot="buttons" disabled=${isSaveDisabled} onclick=${() => {
					closeDialog(`${dialog.querySelector('file-explorer').liveView.path}/${filename.value}`);	
				}}>Save</button>
			</modal-dialog>
		`;
		dialog.style.width = '300px';
		dialog.addEventListener('file-explorer-select-file', ({ detail: file }) => {
			if (file) {
				filename.value = file.name
			}
		});
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

export function readFile(file) {
	// mime types? Where we're going, we don't need mime types
	if (file.name.endsWith('.txt')) {
		Pad.launchNotepad(file);
	} else if (file.name.endsWith('.app')) {
		Pad[`launch${file.name.replace('.app', '')}`]();
	}
}

export function writeFile(file, content) {
	const parts = file.split('/');
	parts.shift(); // remove root
	const filename = parts.pop(); // remove filename
	let directory = root;
	for (const part of parts) {
		if (part === '..') {
			directory = directory.parent;
		} else {
			directory = directory.directories.find(d => d.name === part);
		}
	}

	const existingFile = directory.files.find(f => f.name === filename);
	if (existingFile) {
		existingFile.content = content;
	} else {
		directory.addFile(new File(filename, content));
		for (const view of liveViews) {
			view.refresh();
		}
	}
}
