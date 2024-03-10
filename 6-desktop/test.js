import jsdom from 'jsdom-global';
import { expect } from 'chai';
jsdom(undefined, { url: 'http://localhost' });

async function insertion() {
	const { ConnectedNode } = await import('./runtime.js');

	it('inserts strings as a text node', () => {
		const wrapper = document.createElement('div');
		new ConnectedNode('Hello, World!').connect(wrapper);
		expect(wrapper.childNodes).to.have.lengthOf(1);
		expect(wrapper.childNodes[0])
			.to.be.instanceOf(Text)
			.to.have.property('textContent', 'Hello, World!');
	});

	it('inserts numbers as a text node', () => {
		const wrapper = document.createElement('div');
		new ConnectedNode(123.45).connect(wrapper);
		expect(wrapper.childNodes).to.have.lengthOf(1);
		expect(wrapper.childNodes[0])
			.to.be.instanceOf(Text)
			.to.have.property('textContent', '123.45');
	});

	it('inserts booleans as a text node', () => {
		const falseWrapper = document.createElement('div');
		new ConnectedNode(false).connect(falseWrapper);
		expect(falseWrapper.childNodes).to.have.lengthOf(1);
		expect(falseWrapper.childNodes[0])
			.to.be.instanceOf(Text)
			.to.have.property('textContent', 'false');

		const trueWrapper = document.createElement('div');
		new ConnectedNode(true).connect(trueWrapper);
		expect(trueWrapper.childNodes).to.have.lengthOf(1);
		expect(trueWrapper.childNodes[0])
			.to.be.instanceOf(Text)
			.to.have.property('textContent', 'true');
	});

	it('inserts an HTMLElement directly', () => {
		const wrapper = document.createElement('div');
		const element = document.createElement('span');
		new ConnectedNode(element).connect(wrapper);
		expect(wrapper.childNodes).to.have.lengthOf(1);
		expect(wrapper.childNodes[0]).to.equal(element);
	});

	it('inserts an array of nodes', () => {
		const wrapper = document.createElement('div');
		const element = document.createElement('span');
		new ConnectedNode(['first', element, 'last']).connect(wrapper);
		expect(wrapper.childNodes).to.have.lengthOf(3);
		expect(wrapper.childNodes[0])
			.to.be.instanceOf(Text)
			.to.have.property('textContent', 'first');
		expect(wrapper.childNodes[1]).to.equal(element);
		expect(wrapper.childNodes[2])
			.to.be.instanceOf(Text)
			.to.have.property('textContent', 'last');

		// THEN: add test cases for connecting+replacing an array value
	});
}

async function replace() {
	const { ConnectedNode } = await import('./runtime.js');

	it('replaces with a text node', () => {
		const container = document.createElement('div');
		const wrapper = document.createElement('div');
		container.append(wrapper);
		new ConnectedNode('Hello, World!').connect(wrapper, { replace: true });
		expect(wrapper).to.have.property('parentNode', null);
		expect(container.childNodes).to.have.lengthOf(1);
		expect(container.childNodes[0])
			.to.be.instanceOf(Text)
			.to.have.property('textContent', 'Hello, World!');
	});

	it('replaces with an HTMLElement', () => {
		const container = document.createElement('div');
		const wrapper = document.createElement('div');
		container.append(wrapper);
		const element = document.createElement('span');
		new ConnectedNode(element).connect(wrapper, { replace: true });
		expect(wrapper).to.have.property('parentNode', null);
		expect(container.childNodes).to.have.lengthOf(1);
		expect(container.childNodes[0]).to.equal(element);
	});
}

insertion();
replace();

function it(message, test) {
	test();
}