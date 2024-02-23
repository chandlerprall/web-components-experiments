import { html, element } from 'runtime';

export const modals = html();

export const openFileDialog = () => {
	return new Promise(resolve => {
		const closeDialog = (result) => {
			const dialogIdx = modals.indexOf(dialog);
			modals.splice(dialogIdx, 1);
			resolve(result);
		}

		const dialog = element`
			<modal-dialog>
				<strong>Select file</strong>
				
				<select size="5">
					<option>quick_brown_fox</option>
					<option>Two</option>
				</select>
				
				
				<button slot="buttons" onclick=${() => closeDialog(null)}>Close</button>
				<button slot="buttons" onclick=${() => closeDialog(dialog.querySelector('select').value)}>Open</button>
			</modal-dialog>
		`;
		dialog.style.width = '300px';
		modals.push(dialog);
	});
};

export const openSaveDialog = () => {
	return new Promise(resolve => {
		const closeDialog = (result) => {
			const dialogIdx = modals.indexOf(dialog);
			modals.splice(dialogIdx, 1);
			resolve(result);
		}

		const dialog = element`
			<modal-dialog>
				<strong>Save file</strong>
				
				<button slot="buttons" onclick=${() => closeDialog(false)}>Cancel</button>
				<button slot="buttons" onclick=${() => closeDialog(true)}>Save</button>
			</modal-dialog>
		`;
		dialog.style.width = '300px';
		modals.push(dialog);
	});
};
