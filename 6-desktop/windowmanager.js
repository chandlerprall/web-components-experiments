import { html, node } from 'runtime';

export const windows = html();

export class Window {
	#title = null;
	#content = null;
	#element = null;

	constructor(title, content) {
		this.#title = title;
		this.#content = content;

		this.#element = node`
			<desktop-window>
				<span slot="title"></span>
				<div slot="content"></div>
			</desktop-window>
		`;

		this.#element.style.width = '640px';
		this.#element.style.height = '480px';

		this.#element.style.top = `${window.innerHeight / 2 - 240}px`;
		this.#element.style.left = `${window.innerWidth / 2 - 320}px`;

		this.#element.querySelector('[slot=title]').appendChild(title);
		this.#element.querySelector('[slot=content]').appendChild(content);

		this.#element.addEventListener('mousedown', () => this.focus());
		this.focus();

		windows.push(this.#element);
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