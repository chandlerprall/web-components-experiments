import { html, element } from 'runtime';

export const windows = html();
export const taskbarButtons = html();

export class Window {
	#icon = null;
	#title = null;
	#content = null;
	#element = null;
	#taskbarButton = null;

	constructor(icon, title, content) {
		this.#icon = icon;
		this.#title = title;
		this.#content = content;

		this.#element = element`
			<desktop-window onmousedown=${() => this.focus()}>
				<span slot="title">${icon} ${title}</span>
				<div slot="content">${content}</div>
			</desktop-window>
		`;	

		this.#element.style.width = '640px';
		this.#element.style.height = '480px';
		this.#element.style.top = `${Math.max(window.innerHeight / 2 - 240, 0)}px`;
		this.#element.style.left = `${Math.max(window.innerWidth / 2 - 320, 0)}px`;
		windows.push(this.#element);

		this.#taskbarButton = element`<button onclick=${() => this.focus()}>${icon}</button>`;
		taskbarButtons.push(this.#taskbarButton);

		this.focus();
	}

	focus() {
		const currentZIndex = parseInt(this.#element.style.zIndex || windows.length, 10);

		for (let i = 0; i < windows.length; i++) {
			const window = windows[i];
			const windowZIndex = parseInt(window.style.zIndex || windows.length, 10);
			if (windowZIndex >= currentZIndex) {
				window.style.zIndex = windowZIndex - 1;
			}
		}

		this.#element.style.zIndex = windows.length;

		for (let i = 0; i < taskbarButtons.length; i++) {
			const taskbarButton = taskbarButtons[i];
			if (taskbarButton === this.#taskbarButton) {
				taskbarButton.classList.add('active');
			} else {
				taskbarButton.classList.remove('active');
			}
		}
	}
}