import { registerComponent } from 'runtime';

registerComponent('desktop-app', ({ render }) => {
	render`
<style>
#desktop {
	padding: 0;
	margin: 0;
	width: 100%;
	height: 100%;
	background-image: url("./background.png");
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
</style>

<main id="desktop">
	<section id="shortcuts"></section>
	<section id="windows"></section>
	<desktop-taskbar id="taskbar">
		<popover-menu direction="up">
			<button class="taskbarButton">▶️</button>
			
			<button slot="menu">📒 Notepad</button>
			<button slot="menu">🧮 Calculator</button>
		</popover-menu>
	</desktop-taskbar>
</main>
	`;
});