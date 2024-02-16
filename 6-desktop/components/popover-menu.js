import { registerComponent, State } from "runtime";

registerComponent('popover-menu', ({ render, attributes, refs }) => {
	const isOpen = new State(false);
	const onAnchorClick = () => {
		isOpen.value = !isOpen.value;
	};

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
			refs.content.style.bottom = attributes.direction.value === 'up' ? '100%' : '0%';
		} else {
			refs.content.classList.remove('open');
		}
	});

	render`
<style>
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
	bottom: 100%;
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

:host {
	display: inline-block;
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
	<menu id="content"><slot name="menu"></slot></menu>
</section>
`;
});
