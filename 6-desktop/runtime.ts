export class ConnectedNode<ValueType = unknown> {
	static getNode(value: any) {
		if (value instanceof HTMLElement) {
			return value;
		}
		return new Text(value);
	}

	#anchor = document.createComment("ConnectedNode anchor");
	#value: ValueType | undefined = undefined;
	#valueNodes: Array<Text | HTMLElement> = [];

	constructor(value?: ValueType) {
		this.#value = value;
	}

	set value(newValue: ValueType) {
		this.#value = newValue;
		this.#inject();
	}

	#removeValueNodes() {
		while (this.#valueNodes.length) {
			this.#valueNodes.pop()?.remove();
		}
	}

	#inject() {
		if (this.#anchor.parentNode == null) return;
		this.#removeValueNodes();

		const values = Array.isArray(this.#value) ? this.#value : [this.#value];

		let afterNode = this.#anchor;
		for (let i = 0; i < values.length; i++) {
			const valueNode = ConnectedNode.getNode(values[i]);
			this.#valueNodes.push(valueNode);
		}
		afterNode.after(...this.#valueNodes);
	}

	connect(targetElement: Element, { replace }: { replace?: boolean } = {}) {
		this.disconnect();

		if (replace === true) {
			targetElement.replaceWith(this.#anchor);
		} else {
			targetElement.append(this.#anchor);
		}
		this.#inject();

		return this;
	}

	disconnect() {
		if (this.#anchor.parentNode != null) {
			this.#removeValueNodes();
			this.#anchor.remove();
		}
		return this;
	}
}

export class ContainedNodeArray extends Array {
	connectedElement: ParentNode | null = null;

	connect(element: Element, { replace }: { replace?: boolean } = {}) {
		this.disconnect();

		if (replace) {
			this.connectedElement = element.parentNode;
		} else {
			this.connectedElement = element;
		}

		if (replace) {
			element.after(...this);
			element.remove();
		} else {
			this.connectedElement?.append(...this);
		}

		// @TODO: watch for changes to `length`
	}

	disconnect() {
		for (let i = 0; i < this.length; i++) {
			const node = this[i];
			node.remove();
		}
	}

	push(...nodes: Node[]) {
		const result = super.push(...nodes);
		this.connectedElement?.append(...nodes);
		return result;
	}

	slice() {
		throw new Error("unimplemented");
		return [];
	}

	splice(start: number, deleteCount: number, ...items: Node[]) {
		const removedElements = super.splice(start, deleteCount, ...items);

		if (this.connectedElement) {
			for (let i = 0; i < removedElements.length; i++) {
				this.connectedElement.removeChild(removedElements[i]);
			}

			// @TODO: if this ContainedNodeArray is empty and the connectedElement has other children,
			// this can insert element in the wrong place
			if (this.connectedElement.children.length === 0 || start === 0) {
				this.connectedElement.append(...items);
			} else {
				this[start - 1].after(...items);
			}
		}

		return removedElements;
	}

	unshift() {
		throw new Error("unimplemented");
		return 0;
	}

	pop() {
		throw new Error("unimplemented");
	}
}

type FromSignals<T> = T extends [Signal<infer Head>, ...infer Tail] ? [Head, ...FromSignals<Tail>] : T extends [Signal<infer Last>] ? [Last] : [];

export class Signal<ValueType = unknown> {
	static with<T extends Signal[]>(...signals: T): Signal<FromSignals<T>> {
		const holder = new Signal(signals.map((signal) => signal.value) as unknown as FromSignals<T>);

		let isQueued = false;
		const doUpdate = () => {
			isQueued = false;
			holder.value = signals.map((signal) => signal.value) as unknown as FromSignals<T>;
		};
		const onUpdate = () => {
			if (isQueued) return;
			isQueued = true;
			queueMicrotask(doUpdate);
		};
		signals.forEach((signal) => signal.on(onUpdate));
		// @TODO: how to garbage collect this?
		return holder;
	}

	#connectedNode: ConnectedNode = new ConnectedNode<ValueType>();
	#value: ValueType;

	#isUpdating = false;
	#listeners: Array<(value: ValueType) => void> = [];

	constructor(value?: ValueType) {
		this.#value = value as ValueType;
		this.#connectedNode.value = value;
	}

	get value(): ValueType {
		return this.#value;
	}

	set value(newValue: ValueType) {
		if (this.#isUpdating) return;
		this.#isUpdating = true;

		this.#value = newValue;
		this.#connectedNode.value = newValue;

		for (let i = 0; i < this.#listeners.length; i++) {
			this.#listeners[i](newValue);
		}

		this.#isUpdating = false;
	}

	on(callback: (value: ValueType) => void) {
		this.#listeners.push(callback);
	}

	off(callback: (value: ValueType) => void) {
		this.#listeners = this.#listeners.filter((listener) => listener !== callback);
	}

	as<NewValueType>(callback: (value: ValueType) => NewValueType) {
		const holder = new Signal<NewValueType>(callback(this.#value));
		// @TODO: how to garbage collect this?
		this.on((nextValue) => {
			const result = callback(nextValue);
			holder.value = result;
		});
		return holder;
	}

	with<OtherSignalType>(otherSignal: Signal<OtherSignalType>) {
		const holder = new Signal<[ValueType, OtherSignalType]>([this.#value, otherSignal.value]);
		const update = () => {
			holder.value = [this.#value, otherSignal.value];
		};
		// @TODO: how to garbage collect this?
		this.on(update);
		otherSignal.on(update);
		return holder;
	}

	connect(element: Element, options?: { replace?: boolean }) {
		this.disconnect();
		this.#connectedNode.connect(element, options);
	}

	disconnect() {
		this.#connectedNode.disconnect();
	}

	toString() {
		return this.#value?.toString();
	}
}

const domParser = new window.DOMParser();
export const html = (...args: [string[], ...unknown[]]) => {
	const { html, hydrate } = render(...args);
	const document = domParser.parseFromString(html, "text/html");
	hydrate(document.body);
	// @ts-ignore
	return new ContainedNodeArray(...document.body.childNodes);
};

let _id = 0;
const uniqueId = () => {
	return `_unique_id_${_id++}`;
};

function processPart(part: unknown, attribute: Attribute | null, hydrations: Hydration[]): string {
	if (part instanceof Signal) {
		const id = uniqueId();
		if (attribute) {
			magicBagOfHolding[id] = part;
			hydrations.push({ type: "attribute", attribute, part, id });
			return attribute.asValue(id);
		} else {
			hydrations.push({ type: "dom", part, id });
			return `<data id="${id}"></data>`;
		}
	} else if (part && typeof part === "object" && ATTRIBUTE_MAP in part) {
		const id = uniqueId();
		hydrations.push({ type: "attributemap", part: part as AttributeMapPart, id });
		return `data-attribute-map=${id}`;
	} else if (part instanceof ContainedNodeArray) {
		const id = uniqueId();
		hydrations.push({ type: "dom", part, id });
		return `<data id="${id}"></data>`;
	} else if (part instanceof Function) {
		const id = uniqueId();
		if (attribute?.type === "handler") {
			hydrations.push({ type: "handler", part: part as EventListener, id, eventName: attribute.name });
		}
		return `"${id}"`;
	} else if (part instanceof HTMLElement) {
		const id = uniqueId();
		magicBagOfHolding[id] = part;
		hydrations.push({ type: "element", part, id });
		return `<data id="${id}"></data>`;
	} else if (Array.isArray(part)) {
		if (attribute) {
			const id = uniqueId();
			magicBagOfHolding[id] = part;
			hydrations.push({ type: "attribute", attribute, part, id });
			return attribute.asValue(id);
		} else {
			return part.map((part) => processPart(part, attribute, hydrations)).join("");
		}
	} else if (attribute) {
		if (typeof part === "boolean" || part === "true" || part === "false" || part == null) {
			const id = uniqueId();
			hydrations.push({ type: "booleanattribute", attribute, part, id });
			return attribute.asValue(id);
		} else if (typeof part === "object" || Array.isArray(part)) {
			const id = uniqueId();
			magicBagOfHolding[id] = part;
			hydrations.push({ type: "attribute", attribute, part, id });
			return attribute.asValue(id);
		}
		return attribute.asValue(`${part}`);
	}
	return typeof part === "string" ? part : `${part}`;
}

class ComponentDefinition {
	constructor(public html: string, public hydrate: (element: HTMLElement) => void) {}
}

interface Attribute {
	name: string;
	type: "handler" | "attribute";
	asValue: (value: string) => string;
}
function getAttributeForExpression(prevString: string): Attribute | null {
	const isQuoted = prevString.at(-1) === '"' && prevString.at(-2) === "=";
	if (!isQuoted && prevString.at(-1) !== "=") return null;

	let attribute = "";
	for (let i = prevString.length - (isQuoted ? 3 : 2); i >= 0; i--) {
		const char = prevString.at(i);
		if (char && char.match(/\S/)) {
			attribute = char + attribute;
		} else {
			break;
		}
	}

	return {
		name: attribute,
		type: attribute.startsWith("on") ? "handler" : "attribute",
		asValue: (value: string) => (isQuoted ? value : `"${value}"`),
	};
}

const ATTRIBUTE_MAP = Symbol("attribute map");
const definedElements = new Set();

const magicBagOfHolding: Record<string, unknown> = {};
// @ts-ignore
window.magicBagOfHolding = magicBagOfHolding;
const collectValue = (id: string) => {
	const value = magicBagOfHolding[id];
	delete magicBagOfHolding[id];
	return value;
}

// type HydrationPart = Signal;
interface DOMHydration {
	type: "dom";
	id: string;
	part: Signal | ContainedNodeArray;
}
interface AttributeHydration {
	type: "attribute";
	id: string;
	part: unknown;
	attribute: Attribute;
}
interface BooleanAttributeHydration {
	type: "booleanattribute";
	id: string;
	part: boolean | "true" | "false" | null | undefined;
	attribute: Attribute;
}
type AttributeMapPart = {
	[ATTRIBUTE_MAP]: Signal<number>;
	[key: string]: Signal<unknown>;
};
interface AttributeMapHydration {
	type: "attributemap";
	id: string;
	part: AttributeMapPart;
}
interface HandlerHydration {
	type: "handler";
	id: string;
	part: EventListener;
	eventName: string;
}
interface ElementHydration {
	type: "element";
	id: string;
	part: HTMLElement;
}
type Hydration = DOMHydration | AttributeHydration | BooleanAttributeHydration | AttributeMapHydration | HandlerHydration | ElementHydration;
const render = (strings: string[] = [""], ...rest: unknown[]) => {
	const hydrations: Hydration[] = [];
	const allParts = [...strings];

	for (let i = 0; i < rest.length; i++) {
		const attribute = getAttributeForExpression(strings[i]);
		const part = processPart(rest[i], attribute, hydrations);
		allParts.splice(i * 2 + 1, 0, part);
	}
	const lines = allParts.join("").split(/[\r\n]+/g);
	for (let i = 0; i < lines.length; i++) {
		lines[i] = lines[i].trim();
	}

	const html = lines.join("\n");
	const hydrate = (owningElement: HTMLElement) => {
		// @TODO: the fallbacks to owningElement to handle when handler is on the top-level node from element``,
		//  this means we're not 100% tied to the IDs
		for (const hydration of hydrations) {
			const { type } = hydration;
			if (type === "dom") {
				const { id, part } = hydration;
				const dataNode = owningElement.shadowRoot?.querySelector(`[id="${id}"]`) ?? owningElement.querySelector(`[id="${id}"]`) ?? owningElement;
				part.connect(dataNode, { replace: true });
			} else if (type === "element") {
				const { id, part } = hydration;
				const dataNode = owningElement.shadowRoot?.querySelector(`[id="${id}"]`) ?? owningElement.querySelector(`[id="${id}"]`) ?? owningElement;
				dataNode.before(part);
				dataNode.remove();
			} else if (type === "attribute") {
				const { id, attribute, part } = hydration;
				const element: HTMLElement = owningElement.shadowRoot?.querySelector(`[${attribute.name}="${id}"]`) ?? owningElement.querySelector(`[${attribute.name}="${id}"]`) ?? owningElement;
				const elementTagLower = element.tagName.toLowerCase();

				if (attribute.name === "style") {
					element.removeAttribute("style");
					function applyStyleObject(element: HTMLElement, style: unknown) {
						if (style != null && typeof style === "object") {
							for (const key in style as Partial<CSSStyleDeclaration>) {
								element.style[key] = (style as Partial<CSSStyleDeclaration>)[key]!;
							}
						} else {
							console.error("style attribute must be an object or Signal, received:", style);
						}
					}
					if (part instanceof Signal) {
						// @TODO: un-apply previous styles from this signal
						part.on((nextValue) => {
							applyStyleObject(element, nextValue);
						});
						applyStyleObject(element, part.value);
					} else {
						applyStyleObject(element, part);
					}
				} else if (definedElements.has(elementTagLower)) {
					// element came from us and already has the attribute set to the id
				} else {
					// we are in charge of managing the attribute value
					if (part instanceof Signal) {
						const updateAttribute = () => {
							if ((element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element instanceof HTMLButtonElement) && attribute.name === "value") {
								element.value = part.value;
							} else {
								if (part.value === false || part.value == null) {
									element.removeAttribute(attribute.name);
								} else {
									element.setAttribute(attribute.name, part.value);
								}
							}
						};
						part.on(updateAttribute);
						updateAttribute();

						// if this element could be a custom element, when it's defined we may yield control of the attribute to the component itself
						if (elementTagLower.indexOf("-") !== -1) {
							customElements.whenDefined(elementTagLower).then(() => {
								if (definedElements.has(elementTagLower) === false) return; // don't swap out if we don't control the element
								part.off(updateAttribute);
								element.setAttribute(attribute.name, hydration.id);
							});
						}
					} else {
						element.setAttribute(attribute.name, `${part}`);

						// if this element could be a custom element, when it's defined we may yield control of the attribute to the component itself
						if (elementTagLower.indexOf("-") !== -1) {
							customElements.whenDefined(elementTagLower).then(() => {
								if (definedElements.has(elementTagLower) === false) return; // don't swap out if we don't control the element
								element.setAttribute(attribute.name, hydration.id);
							});
						}
					}
				}
			} else if (type === "booleanattribute") {
				const { id, attribute, part } = hydration;
				const element = owningElement.shadowRoot?.querySelector(`[${attribute.name}="${id}"]`) ?? owningElement.querySelector(`[${attribute.name}="${id}"]`) ?? owningElement;
				if (!part) {
					element.removeAttribute(attribute.name);
				} else {
					element.setAttribute(attribute.name, "");
				}
			} else if (type === "attributemap") {
				// @TODO: garbage collection
				const {
					part: { [ATTRIBUTE_MAP]: publisher, ...part },
					id,
				} = hydration;
				const updateAttributes = () => {
					for (const attributeName in part) {
						const targetElement = owningElement.shadowRoot?.querySelector(`[data-attribute-map="${id}"]`) ?? owningElement.querySelector(`[data-attribute-map="${id}"]`) ?? owningElement;
						if (typeof part[attributeName].value === "string") {
							targetElement.setAttribute(attributeName, part[attributeName].value as string);
						} else {
							// @TODO: is this encounterable?
							console.error(`unimplemented case for attribute ${attributeName} in attributemap::updateAttributes`);
						}
					}
				};
				updateAttributes();
				publisher.on(() => updateAttributes());
			} else if (type === "handler") {
				const { id, eventName, part } = hydration;
				const targetElement = owningElement.shadowRoot?.querySelector(`[${eventName}="${id}"]`) ?? owningElement.querySelector(`[${eventName}="${id}"]`) ?? owningElement;
				targetElement.removeAttribute(eventName);
				targetElement.addEventListener(eventName.replace(/^on/, "").toLowerCase(), part);
			}
		}
	};

	return new ComponentDefinition(html, hydrate);
};

export const element = (...args: [string[], unknown[]]) => {
	const { html, hydrate } = render(...args);

	const parsingNode = document.createElement('div');
	parsingNode.innerHTML = html;
	const element = parsingNode.firstElementChild as HTMLElement;
	parsingNode.innerHTML = '';

	hydrate(element);

	return element;
};

// https://developer.mozilla.org/en-US/docs/Web/API/Element/attachShadow#elements_you_can_attach_a_shadow_to
const tagNamesThatSupportShadowRoot = new Set(["ARTICLE", "ASIDE", "BLOCKQUOTE", "BODY", "DIV", "FOOTER", "H1", "H2", "H3", "H4", "H5", "H6", "HEADER", "MAIN", "NAV", "P", "SECTION", "SPAN"]);
const elementToContextMap = new WeakMap();
const getElementContext = (element: Element) => {
	let elementContext;
	if (elementToContextMap.has(element)) {
		elementContext = elementToContextMap.get(element);
	} else {
		elementContext = {};
		elementToContextMap.set(element, elementContext);
	}
	return elementContext;
};

type StringWithHyphen = `${string}-${string}`;

type ComponentDefinitionFn = (options: { element: HTMLElement; render: (strings: string[], ...rest: unknown[]) => void; refs: Record<string, Element>; attributes: Record<string, Signal>; context: Record<string, unknown> }) => void;

interface ComponentDefinitionOptions {
	getBaseClass?: () => typeof HTMLElement;
	getElementClass?: (ComponentClass: typeof HTMLElement) => typeof HTMLElement;
	elementRegistryOptions?: ElementDefinitionOptions;
}
export function registerComponent(name: StringWithHyphen, componentDefinition: ComponentDefinitionFn, options: ComponentDefinitionOptions = {}) {
	const { getBaseClass, getElementClass, elementRegistryOptions } = options;

	definedElements.add(name);

	const BaseClass = getBaseClass?.() ?? HTMLElement;
	const ComponentClass = class extends BaseClass {
		attributeValues = new Proxy({ [ATTRIBUTE_MAP]: new Signal(0) } as AttributeMapPart, {
			set: (target, key: string, value) => {
				if (value instanceof Signal) {
					target[key] = value;
				} else {
					target[key].value = value;
				}

				target[ATTRIBUTE_MAP].value++;

				return true;
			},
			get: (target, key: string) => {
				if (key in target === false) {
					target[key] = new Signal();
				}
				return target[key];
			},
		});

		refs: Record<string, Element> = {};

		// @TODO: move things here
		//connectedCallback() {}
		constructor() {
			super();

			for (const attributeName of this.getAttributeNames()) {
				if (attributeName.startsWith("on")) continue;
				const attributeValue = this.getAttribute(attributeName);
				this.#attachAttribute(attributeName, attributeValue);
			}

			const mutationObserver = new MutationObserver((mutations) => {
				for (let i = 0; i < mutations.length; i++) {
					const mutation = mutations[i];
					if (mutation.type !== "attributes") continue;
					const { attributeName } = mutation;
					if (attributeName) {
						const value = this.getAttribute(attributeName);
						this.#attachAttribute(attributeName, value);
					}
				}
			});
			mutationObserver.observe(this, { attributes: true, attributeOldValue: true });

			// only autonomous custom elements & a short list of native elements support shadow roots
			if (tagNamesThatSupportShadowRoot.has(this.tagName) || this.tagName.includes("-")) {
				this.attachShadow({
					mode: "open",
				});
			} else {
				// a shadow root, so we need to catch the error and fallback to using the element itself
				Object.defineProperty(this, "shadowRoot", { value: this });
			}

			this.#initialize();
		}

		#attachAttribute(attributeName: string, value: string | null) {
			if (!this.attributeValues.hasOwnProperty(attributeName)) {
				this.attributeValues[attributeName] = new Signal();
			}

			if (value?.match(/^_unique_id_\d+/)) {
				// @TODO: garbage collection (call off on component disconnectedCallback?)
				const data = collectValue(value);

				if (data instanceof Signal) {
					data.on((nextValue) => {
						this.attributeValues[attributeName] = nextValue;
					});
					this.attributeValues[attributeName].on((nextValue) => {
						data.value = nextValue;
					});
					this.attributeValues[attributeName].value = data.value;
				} else {
					this.attributeValues[attributeName].value = data;
				}
			} else {
				this.attributeValues[attributeName].value = value;
			}
		}

		#initialize() {
			const element = this;

			const context = new Proxy(
				{},
				{
					get(target, key) {
						let currentElement = element.parentElement;
						while (currentElement) {
							const elementContext = getElementContext(currentElement);
							if (elementContext[key] !== undefined) {
								return elementContext[key];
							}
							currentElement = currentElement.parentElement;
						}
					},

					set(target, key, value) {
						getElementContext(element)[key] = value;
						return true;
					},
				}
			);

			// @TODO: alert component definition on unmount
			componentDefinition({
				element: this,
				render: (...args) => {
					const { html, hydrate } = render(...args);
					(this.shadowRoot ?? this).innerHTML = html;
					hydrate(this);

					// bind elements to refs
					// @TODO: this doesn't catch dom changes, should we use a mutation observer
					const elementsWithIds = (this.shadowRoot ?? this).querySelectorAll("[id]");
					for (let i = 0; i < elementsWithIds.length; i++) {
						const element = elementsWithIds[i];
						const id = element.id;
						this.refs[id] = element;
					}
				},
				refs: this.refs,
				attributes: this.attributeValues,
				context,
			});
		}

		emit(eventName: string, detail: unknown) {
			return this.dispatchEvent(
				new CustomEvent(`${name}-${eventName}`, {
					composed: true,
					bubbles: true,
					cancelable: true,
					detail,
				})
			);
		}
	};
	Object.defineProperty(ComponentClass, "name", { value: name });

	const elementClass = getElementClass?.(ComponentClass) ?? ComponentClass;
	customElements.define(name, elementClass, elementRegistryOptions);
}