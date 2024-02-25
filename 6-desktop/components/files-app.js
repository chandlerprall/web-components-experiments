import { registerComponent, html, element } from 'runtime';
import { LiveView, openFile } from '../filemanager.js';

registerComponent('files-app', ({ render, element: me }) => {
	const liveView = me.liveView = new LiveView('');

	const crumbs = html``;
	const directories = html``;
	const files = html``;

	function update() {
		crumbs.splice(0, crumbs.length);
		directories.splice(0, directories.length);
		files.splice(0, files.length);

		const path = liveView.path.split('/');
		for (const part of path) {
			crumbs.push(element`
				<button class="crumb" onclick=${() => liveView.navigate(path.slice(0, path.indexOf(part) + 1).join('/'))}>
					${part || '/'}
				</button>
			`);
		}
		for (const directory of liveView.directories.value) {
			directories.push(element`
				<button class="item directory" ondblclick=${() => liveView.navigate(`${liveView.path}/${directory.name}`)}>
					<span class="icon">📁</span>
					<span class="name">${directory.name}</span>
				</button>
			`);
		}
		for (const file of liveView.files.value) {
			files.push(element`
				<button class="item file" ondblclick=${() => openFile(file)}>
					<span class="icon">${file.icon}</span>
					<span class="name">${file.name}</span>
				</button>
			`);
		}
	}
	liveView.directories.onUpdate(update);
	liveView.files.onUpdate(update);
	update();

	render`
<style>
:host {
	--breadcrumbs-height: 24px;
}

#breadcrumbs {
	height: var(--breadcrumbs-height);
	background-color: var(--token-color-system);
	display: flex;
	justify-items: flex-start;
	align-items: center;
	
	.crumb {
		border: 0;
		background-color: var(--token-color-system);
		
		&:active {
			filter: brightness(1.03);
		}
		&:hover {
			filter: brightness(1.05);
		}
		&:active {
			filter: brightness(0.95);
		}
	}
}

#container {
	display: flex;
	height: calc(100% - var(--breadcrumbs-height));
	flex-wrap: wrap;
	justify-content: flex-start;
	align-content: flex-start;
	background-color: var(--token-color-background);
	overflow-y: scroll;
}

.item {
	display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-evenly;
  
	background-color: transparent;
	border: 0;
	width: 100px;
	height: 100px;
	
	.icon {
		font-size: 32px;
		line-height: 32px;
	}
	
	.name {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		width: 100%;
	}
	
	&:hover, &:focus {
		border: 1px solid var(--token-color-border);
		
		.name {
			all: unset;
			background-color: color-mix(in srgb, var(--token-color-background) 80%, transparent);
			z-index: 1;
		}
	}
	
	&:focus {
		background-color: color-mix(in srgb, var(--token-color-highlight) 80%, transparent);
	}
}
</style>
<section id="breadcrumbs">${crumbs}</section>
<section id="container">
	${directories}
	${files}
</section>
	`;
}, class FilesApp extends HTMLElement {
	disconnectedCallback() {
		this.liveView.close();
	}
});
