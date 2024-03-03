# Desktop

![screenshot of desktop app](../images/screenshot-desktop.png)

Moved runtime into an importable module instead of global script.

Added `element` tagged template literal to easily create an element with the same syntax as `render`.

Automatically create a `refs` object mapping IDs to the corresponding elements.

Better event handling, including support for custom events. Handlers no longer pollute the global scope

Introduced `State::as` to map state values without losing reactivity

## Challenges to solve

* Map/[array method] over a state array (directories/files)
  * similar, passing `disabled=${!someState}`
* custom attribute handling
  * e.g. `on-file-explorer-select-file=${}`
  * `style`
* If an attribute isn't set, there's no state value to subscribe to
  * attribute states should be created on read (`file-explorer`'s filter)
* false attributes need to be managed
  * `<button disabled=${'false'}>...</button>`
  * `<button disabled=${false}>...</button>`
  * `<button disabled="false">...</button>`
* `registerComponent`'s class extending is backwards
* `element<div id="${value}"></div>` isn't handled an attribute 