import { registerComponent, element } from 'runtime';
import { windows, taskbarButtons, launchWindow } from '../windowmanager.js'
import { modals as fileModals, openFile } from '../filemanager.js';

registerComponent('desktop-app', ({ render, refs }) => {
	render`
<style>
#desktop {
	padding: 0;
	margin: 0;
	width: 100%;
	height: 100%;
	background-image: url("./images/backgrounds/00061-3864669736.png");
	background-size: cover;
	background-position: center;
}

file-explorer {
	width: 100%;
	height: 100%;
}

#windows {
	z-index: 1;
}

#taskbar {
	z-index: 2;
	height: 40px;
	
	popover-menu {
		height: 100%;
	}
}

.taskbarButton {
	padding: 0;
	margin: 0;
	height: 100%;
	min-height: inherit;
	aspect-ratio: 1;
	border: 0;
	
	&:hover {
		filter: brightness(1.05);
	}
	&:active {
		filter: brightness(0.95);
	}
}

#modals {
  z-index: 1000;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  
  &:not(:empty) {
    background-color: color-mix(in srgb, var(--token-color-system) 80%, transparent);  
  }
  * {
    pointer-events: all;
  }
}
</style>

<main id="desktop">
	<file-explorer id="desktopFiles" view="desktop" initialpath="/desktop"></file-explorer>
	<section id="windows">${windows}</section>
	<desktop-taskbar id="taskbar">
		<popover-menu direction="up">
			<button class="taskbarButton">❇️</button>
			
			<button slot="menu" onClick=${() => launchNotepad()}>📝 Notepad</button>
			<button slot="menu" onClick=${() => launchCalculator()}>🧮 Calculator</button>
			<button slot="menu" onClick=${() => launchFiles()}>🗂️ Files</button>
		</popover-menu>
		${taskbarButtons}
	</desktop-taskbar>
	<section id="modals">${fileModals}</section>
</main>
	`;

	refs.desktopFiles.addEventListener('file-explorer-dblclick-file', ({ detail: file }) => openFile(file));
	refs.desktopFiles.addEventListener(
		'file-explorer-dblclick-directory',
		(e) => {
			e.preventDefault();
			launchFiles(e.detail.path);
		},
		true
	);
});

export function launchCalculator() {
	const window = launchWindow(element`
		<desktop-window>
			<span slot="icon">🧮</span>
			<span slot="title">Calc</span>
			<calculator-app></calculator-app>
		</desktop-window>
	`);
	window.style.width = 'auto';
	window.style.aspectRatio = '400 / 387';
}
export function launchNotepad(file = '') {
	launchWindow(element`
		<desktop-window>
			<span slot="icon">📝</span>
			<span slot="title">Notepad</span>
			<notepad-app file=${file}></notepad-app>
		</desktop-window>
	`);
}

export function launchFiles(path = '/') {
	launchWindow(element`
		<desktop-window>
			<span slot="icon">🗂️</span>
			<span slot="title">Files</span>
			<files-app initialpath=${path}></files-app>
		</desktop-window>
	`);
}
