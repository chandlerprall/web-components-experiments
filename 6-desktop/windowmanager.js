import { html, node, element } from 'runtime';

export const windows = html();

export class Window {
	#title = null;
	#content = null;
	#element = null;

	constructor(title, content) {
		this.#title = title;
		this.#content = content;
		this.#element = element`
			<desktop-window onmousedown=${() => this.focus()}>
				<span slot="title">${title}</span>
				<div slot="content">${content}</div>
			</desktop-window>
		`;	

		this.#element.style.width = '640px';
		this.#element.style.height = '480px';

		this.#element.style.top = `${Math.max(window.innerHeight / 2 - 240, 0)}px`;
		this.#element.style.left = `${Math.max(window.innerWidth / 2 - 320, 0)}px`;

		windows.push(this.#element);
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
	}
}