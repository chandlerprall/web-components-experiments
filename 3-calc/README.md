# Calc

![screenshot of calc app](../images/screenshot-calc.png)

Exploring state management, event handling, and an augmented HTML model.

## State management

Introduced the `DataConnection` class that wraps a value and allows for subscribing to changes. In the calculator, the subscriptions are used to update the result when the equation changes.

## Events

Logic that would normally be captured in a callback function are instead emitted as events. This allowed for exploring the eventing model without creating a larger application surface.

> [!TIP]
> Using events instead of callback functions has the side-effect that parent/ancestor components can also respond to the same events.

## Augmented HTML model

A huge benefit of libraries like React and Vue is representing DOM structure alongside dynamic values and attaches event callbacks.

Up to this point, component DOM has to be written in the HTML file and then state and events are managed by a class instance in the JavaScript file.

This experiment introduced a `component` tagged template literal that sets the component's HTML. The template literal is processed to understand callback functions, binding state to attributes, and rendering variables into the DOM.

```html
<script>
	const value = "hello";
	const state = new DataConnection("world");
	this.html = component`
  <div>
    ${value}, ${state}
  </div>
`;
</script>
```
