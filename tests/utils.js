import React from 'react';

const keyMap = {
	enter: {which: 13, code: 'Enter'},
	space: {which: 32, code: 'Space'}
};

function initContainer() {
	const container = document.createElement('div');
	container.id = 'root';
	document.body.appendChild(container);
	return container;
}

function leftClick(node, ) {
	const evt = new MouseEvent('click', {
		bubbles: true,
		button: 0,
		buttons: 1,
		which: 1
	});
	node.dispatchEvent(evt)
}

function keydown(node, key = 'enter') {
	const {which, code} = (keyMap[key] || keyMap.enter);
	const evt = new KeyboardEvent('keydown', {
		bubbles: true,
		keyCode: which,
		which,
		charCode: which,
		key: code,
		code
	});
	node.focus();
	node.dispatchEvent(evt)
}

function testApp() {
	return {
		selector: '#test-target',
		app: (
			<div>
				<button id="test-target">Click Me</button>
			</div>
		)
	};
}

export {
	initContainer,
	leftClick,
	keydown,
	testApp
};
