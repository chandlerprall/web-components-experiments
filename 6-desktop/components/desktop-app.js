import { registerComponent } from 'runtime';
import { Window, windows, taskbarButtons } from '../windowmanager.js'

registerComponent('desktop-app', ({ render }) => {
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

#taskbar {
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

#calculator {
	top: 50px;
}
</style>

<main id="desktop">
	<section id="shortcuts"></section>
	<section id="windows">${windows}</section>
	<desktop-taskbar id="taskbar">
		<popover-menu direction="up">
			<button class="taskbarButton">▶️</button>
			
			<button slot="menu" onClick=${launchNotepad}>📝 Notepad</button>
			<button slot="menu" onClick=${launchCalculator}>🧮 Calculator</button>
		</popover-menu>
		${taskbarButtons}
	</desktop-taskbar>
</main>
	`;
});

function launchCalculator() {
	new Window('🧮', 'Calc', 'content');
}
function launchNotepad() {
	new Window('📝', 'Notepad', '<notepad-app></notepad-app>');
}
