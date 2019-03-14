import React from 'react';

const keyMap = {
	enter: {which: 13, code: 'Enter'},
	space: {which: 32, code: 'Space'}
};

const testApp = (
	<div data-parent-target aris-label="Top ancestor target">
		<div data-parent-target aria-label="Nearest ancestor target">
			<button id="test-target">Click Me</button>
			<button id="data-button" data-metric-label="Data metric label" aria-label="Aria label">Click Me</button>
			<button id="aria-button" aria-label="Aria label">Click Me</button>
		</div>
	</div>
);

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
	const {which, code} = keyMap[key];
	const evt = new KeyboardEvent('keydown', {
		bubbles: true,
		keyCode: which,
		which,
		charCode: which,
		key: code,
		code
	});
	if(node.focus) node.focus();
	node.dispatchEvent(evt)
}

export {
	initContainer,
	leftClick,
	keydown,
	testApp
};
