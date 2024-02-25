# Desktop

![screenshot of desktop app](../images/screenshot-desktop.png)

Moved runtime into an importable module instead of global script.

Added `element` tagged template literal to easily create an element with the same syntax as `render`.

Automatically create a `refs` object mapping IDs to the corresponding elements.

## Challenges to solve

* Map/[array method] over a state array (directories/files)
  * similar, passing `disabled=${!someState}`
* If an attribute isn't set, there's no state value to subscribe to
  * attribute states should be created on read (`file-explorer`'s filter)
* false attributes need to be managed
  * `<button disabled=${'false'}>...</button>`
  * `<button disabled=${false}>...</button>`
  * `<button disabled="false">...</button>`
