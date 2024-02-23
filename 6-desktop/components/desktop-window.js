import { registerComponent } from 'runtime';

registerComponent('desktop-window', ({ element, render }) => {
	const lastCursorPosition = { x: 0, y: 0 };
	const onTitleMouseDown = ({ clientX, clientY }) => {
		lastCursorPosition.x = clientX;
		lastCursorPosition.y = clientY;
		window.addEventListener('mousemove', onWindowMouseMove);
		window.addEventListener('mouseup', onWindowMouseUp);
	}
	const onWindowMouseUp = (e) => {
		onWindowMouseMove(e);
		window.removeEventListener('mousemove', onWindowMouseMove, { capture: false });
		window.removeEventListener('mouseup', onWindowMouseUp);
	}
	const onWindowMouseMove = ({ clientX, clientY }) => {
		const deltaX = clientX - lastCursorPosition.x;
		const deltaY = clientY - lastCursorPosition.y;
		element.style.left = `${element.offsetLeft + deltaX}px`;
		element.style.top = `${element.offsetTop + deltaY}px`;
		lastCursorPosition.x = clientX;
		lastCursorPosition.y = clientY;
	}

	element.addEventListener('mousedown', () => element.focus());

	render`
<style>
:host {
	position: absolute;
	height: inherit;
	width: inherit;
  box-sizing: border-box;
  border: 1px solid var(--token-color-border);
  display: flex;
  flex-direction: column;
}

#titlebar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  
	background-color: var(--token-color-system);
	height: var(--desktop-window-titlebar-height, 25px);
	box-sizing: border-box;
	border-bottom: 1px solid var(--token-color-border);
	
	cursor: default;
	
	#close {
		border: 0;
		cursor: pointer;
	}
}

::slotted(menu) {
	display: flex;
	margin: 0;
	padding: 0;
	height: var(--desktop-window-menubar-height, 25px);
	align-items: center;
	background-color: var(--token-color-system);
}

#content {
	background-color: var(--token-color-system);
	height: calc(100% - var(--desktop-window-titlebar-height, 25px));
}
</style>

<div id="titlebar" onMouseDown=${onTitleMouseDown}>
	<span>
		<slot name="icon"></slot>
		<slot name="title"></slot>
	</span>
	<button id="close" onclick=${() => element.close()}>ⓧ</button>
</div>
<slot name="menu"></slot>
<div id="content"><slot></slot></div>
	`;
}, class DesktopWindow extends HTMLElement {
	focus() {
		this.emit('focus');
	}

	close() {
		this.emit('close');
	}
});
