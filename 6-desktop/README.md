# Desktop

![screenshot of desktop app](../images/screenshot-desktop.png)

Moved runtime into an importable module instead of global script.

Added `element` tagged template literal to easily create an element with the same syntax as `render`.

Components get a `refs` object automatically mapping IDs to the corresponding elements.

Better event handling, including support for custom events. Handlers no longer pollute the global scope

A component's `attributes` object now auto-populates a value when accessed.

Introduced `State::as` to map state values without losing reactivity

Introduced `State::with` to map multiple state values without losing reactivity

Introduced `ConnectedNode` to better manage value rendering into DOM locations.

## Challenges to solve

- Map/[array method] over a state array (directories/files)
  - at least for now, doable with `state.as()`
  - similar, passing `disabled=${!someState}`
- custom attribute handling
  - `style`
- false attributes need to be managed
  - `<button disabled=${'false'}>...</button>`
  - `<button disabled=${false}>...</button>`
  - `<button disabled="false">...</button>`
- `registerComponent`'s class extending is backwards
- when attribute values are enclosed in quotes - `element<div id="${value}"></div>` - it isn't handled as an attribute
