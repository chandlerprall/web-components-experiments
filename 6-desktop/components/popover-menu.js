import { registerComponent, State } from 'runtime';

registerComponent('popover-menu', ({ render, attributes, refs }) => {
	const isOpen = new State(false);

	window.addEventListener('click', () => {
		isOpen.value = false;
	});

	const onAnchorClick = (e) => {
		e.stopImmediatePropagation();
		e.preventDefault();
		isOpen.value = !isOpen.value;
	};
	const onMenuClick = () => {
		isOpen.value = false;
	}

	let leavingTimeout;
	const onMouseLeave = () => {
		leavingTimeout = setTimeout(() => {
			isOpen.value = false;
		}, 500);
	};
	const onMouseEnter = () => {
		clearTimeout(leavingTimeout);
	};

	isOpen.onUpdate(isOpen => {
		if (isOpen) {
			refs.content.classList.add('open');
			if (attributes.direction?.value === 'up') {
				refs.content.style.bottom = '100%';
			} else {
				refs.content.style.top = '100%';
			}
		} else {
			refs.content.classList.remove('open');
		}
	});

	render`
<style>
:host {
	display: inline-block;
}

.popover-menu {
	display: inline-block;
	height: inherit;
	position: relative;
}

#anchor {
	height: inherit;
}

#content {
	display: none;
	flex-direction: column;
	position: absolute;
	left: 50%;
	transform: translateX(-50%);
	margin: 0;
	padding: 5px 2px;
	
	background-color: var(--token-color-system);
	border: 1px solid var(--token-color-border);
	
	&.open {
		display: flex;
	}
}

menu ::slotted(button) {
	border-width: 0;
	text-wrap: nowrap;
	text-align: left;
	padding: 5px 5px;
}
menu ::slotted(button:hover) {
	filter: brightness(1.05);
}
menu ::slotted(button:active) {
	filter: brightness(0.95);
}
</style>

<section class="popover-menu" onmouseleave=${onMouseLeave} onmouseenter=${onMouseEnter}>
	<div id="anchor" onclick=${onAnchorClick}><slot></slot></div>
	<menu id="content" onclick=${onMenuClick}><slot name="menu"></slot></menu>
</section>
`;
});
