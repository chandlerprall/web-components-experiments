import { registerComponent } from 'runtime';
import { LookupWindow } from '../windowmanager.js';

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

	render`
<style>
:host {
	position: absolute;
	height: inherit;
	width: inherit;
  box-sizing: border-box;
  border: 1px solid var(--token-color-border);
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

#content {
	background-color: var(--token-color-system);
	height: calc(100% - var(--desktop-window-titlebar-height, 25px));
}
</style>

<div id="titlebar" onMouseDown=${onTitleMouseDown}><slot name="title"></slot><button id="close" onclick=${() => element[LookupWindow].close()}>ⓧ</button></div>
<div id="content"><slot name="content"></slot></div>
	`;
});
