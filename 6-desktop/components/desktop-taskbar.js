import { registerComponent } from 'runtime';

registerComponent('desktop-taskbar', ({ render }) => {
	render`
<style>	
:host {
	display: flex;
	justify-content: center;
	align-content: center;
	flex-wrap: wrap;
	position: fixed;
	bottom: 0;
	width: 100%;
	height: inherit;
	background-color: var(--token-color-system);
	border-top: 1px solid var(--token-color-border);
}
</style>

<slot></slot>
	`;
});