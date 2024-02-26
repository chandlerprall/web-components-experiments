import { registerComponent, State } from 'runtime';

const background = new State('#ffffff');
const highlight = new State('#a9c2ea');
const system = new State('#f0f0f0');
const border = new State('#e0e0e0');

const settingsMap = {
	background,
	highlight,
	system,
	border,
};

const settingtoPropertyMap = {
	background: '--token-color-background',
	highlight: '--token-color-highlight',
	system: '--token-color-system',
	border: '--token-color-border',
};

registerComponent('settings-app', ({ render, refs }) => {
	const selectedColor = new State(null);

	Object.entries(settingsMap).forEach(([setting, state]) => {
		state.onUpdate(newColor => {
			refs[setting].style.color = newColor;
			document.body.style.setProperty(settingtoPropertyMap[setting], newColor);
		});
	});

	selectedColor.onUpdate((setting) => {
		const currentHex = settingsMap[setting].value;
		refs.picker.innerHTML = `<color-picker initialvalue="${currentHex}"></color-picker>`;
		refs.picker.children[0].addEventListener('color-picker-color', ({ detail }) => {
			settingsMap[setting].value = detail;
		});
	});

	render`
<style>
:host {
	display: flex;
	height: 100%;
}

#swatches {
	flex-basis: fit-content;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 15px;
  height: 100%;
  width: 300px;
  align-content: flex-start;
  
  background-color: color-mix(in srgb, var(--token-color-system) 95%, #000);
  padding-top: 25px;
  box-sizing: border-box;
  
  button {
		border: 0;
		width: 70%;
		border-radius: 15px;
		padding: 5px 50px;
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		flex-direction: row-reverse;
		align-items: center;
		gap: 15px;
		
		.swatch {
			display: inline-block;
			width: 20px;
			aspect-ratio: 1;
			border-radius: 5px;
			background-color: currentColor;
		}
		span:not(.swatch) {
			color: var(--token-color-foreground);
		}
		
		&:hover {
			filter: brightness(1.05);
		}
		&:active {
			filter: brightness(1.03);
		}
	}
}

#picker {
  flex-basis: 100%;
  display: flex;
  justify-content: center;
  padding-top: 15px;
}
</style>

<div id="swatches">
	<button id="background" onclick=${() => selectedColor.value = 'background'}>
		<span class="swatch"></span>
		<span>background</span>
	</button>
	
	<button id="highlight" onclick=${() => selectedColor.value = 'highlight'}>
		<span class="swatch"></span>
		<span>highlight</span>
	</button>
	
	<button id="system" onclick=${() => selectedColor.value = 'system'}>
		<span class="swatch"></span>
		<span>system</span>
	</button>
	
	<button id="border" onclick=${() => selectedColor.value = 'border'}>
		<span class="swatch"></span>
		<span>border</span>
	</button>
</div>

<div id="picker"></div>
	`;

	refs.background.style.color = background.value;
	refs.highlight.style.color = highlight.value;
	refs.system.style.color = system.value;
	refs.border.style.color = border.value;
});
