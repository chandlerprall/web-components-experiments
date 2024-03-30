import v8 from 'v8';
import jsdom from 'jsdom-global';
import { expect } from 'chai';
jsdom(undefined, { url: 'http://localhost' });

const MB = 1024 * 1024;

async function element() {
	const { element, Signal } = await import('../runtime.js');

	it('is cleaned up after', () => {
		const testMemory = prepMemory();
		const obj = makeObject(8);
		// global.obj = obj;
		// const div = element`<div>${getString(5 * MB)}</div>`;
		// element`<div>${getString(0.5 * MB)}</div>`;

		// testMemory();
		setTimeout(testMemory);


	});
}

element();

function it(message, test) {
	test();
}

function prepMemory() {
	gc();
	// const currentHeap = process.memoryUsage().heapUsed;
	const oldStats = v8.getHeapStatistics();
	return (delta = 0) => {
		gc();
		const newStats = v8.getHeapStatistics();

		const heapSizeDelta = newStats.total_heap_size - oldStats.total_heap_size;
		console.log({ heapSizeDelta })
		// const newHeap = process.memoryUsage().heapUsed;
		// console.log('::', newHeap - currentHeap, currentHeap, newHeap);
		// expect(heapSizeDelta).to.be.closeTo(0, delta);
	};
}

const lorum = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.';
function getString(minsize) {
	let length = lorum.length;
	let string = lorum;
	while (length < minsize) {
		string += lorum;
		length += lorum.length;
	}
	return string;
}

function makeObject(size) {
	const obj = {};
	for (let i = 0; i < size; i++) {
		obj[i] = makeObject(size - 1);
	}
	return obj;
}