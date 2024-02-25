import { registerComponent, html, element } from 'runtime';
import { LiveView, readFile } from '../filemanager.js';

registerComponent('file-explorer', ({ render, element: me, attributes }) => {
	const liveView = me.liveView = new LiveView(attributes.initialpath?.value || '');

	const crumbs = html``;
	const directories = html``;
	const files = html``;

	me.addEventListener('click', () => me.emit('select-file', null));

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
			const buttonElement = element`
				<button
					class="item file"
					onclick=${(e) => {
						e.stopImmediatePropagation();
						me.emit('select-file', file)
					}}
					ondblclick=${() => me.emit('dblclick-file', file)}
				>
					<span class="icon">${file.icon}</span>
					<span class="name">${file.name}</span>
				</button>
			`;
			files.push(buttonElement);
			if (!file.name.endsWith(attributes.filter?.value || '')) {
				buttonElement.setAttribute('disabled', 'true')
			}
		}
	}
	liveView.directories.onUpdate(update);
	liveView.files.onUpdate(update);
	attributes.filter?.onUpdate(update);
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
	border-style: inset;
	
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
			background-color: color-mix(in srgb, var(--token-color-background) 80%, transparent);
		}
		
		&:focus {
			background-color: color-mix(in srgb, var(--token-color-highlight) 80%, transparent);
		}
	}
	
	&:not(.list) .item {
		&:hover, &:focus {
			border: 1px solid var(--token-color-border);
			
			.name {
				all: unset;
				z-index: 1;
			}
		}
	}
	
	&.list {
		overflow-y: scroll;
		flex-direction: row;
		
		.item {
			width: 100%;
			height: unset;
			flex-direction: row;
			gap: 5px;
			
			.icon {
				font-size: unset;
				line-height: unset;
			}
			
			.name {
				text-align: start;
				
			}
		}
	}
}
</style>
<section id="breadcrumbs">${crumbs}</section>
<section id="container" class=${attributes.view ?? ''}>
	${directories}
	${files}
</section>
	`;
}, class FileExplorer extends HTMLElement {
	disconnectedCallback() {
		this.liveView.close();
	}
});