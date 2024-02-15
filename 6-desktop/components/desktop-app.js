import { registerComponent } from 'runtime';

registerComponent('desktop-app', ({ render }) => {
	render`
<style>
#desktop {
	padding: 0;
	margin: 0;
	width: 100%;
	height: 100%;
}

#taskbar {
	display: flex;
	justify-content: center;
	align-content: center;
	flex-wrap: wrap;
	position: fixed;
	bottom: 0;
	width: 100%;
	height: 40px;
	background-color: var(--token-color-system);
	border-top: 1px solid var(--token-color-border);
}
</style>

<main id="desktop">
	<section id="shortcuts"></section>
	<section id="windows"></section>
	<section id="taskbar">
		<popover-menu direction="up">
			<button>▶️</button>
			
			<button slot="menu">📒 Notepad</button>
			<button slot="menu">🧮 Calculator</button>
			</div>
		</popover-menu>
	</section>
</main>
	`;
});