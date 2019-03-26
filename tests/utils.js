import {coerceArray} from '@enact/core/util';
import {mount} from 'enzyme';
import React from 'react';

const defaultTarget = '#test-target';
const defaultConfig = {
	enabled: true,
	selector: '[id]',
	idle: false,
	rules: [
		{
			data: {}
		}
	]
};
const container = document.body.appendChild(document.createElement('div'));

// Keymap for keydown usage
const keyMap = {
	enter: {which: 13, code: 'Enter'},
	space: {which: 32, code: 'Space'},
	escape: {which: 27, code: 'Escape'}
};

// Basic app with a balanced layout that is useful for a variety of situations
const basicApp = (
	<article data-parent-target aria-label="Top ancestor target">
		<header>
			<h1>Header Text</h1>
		</header>
		<section data-parent-target aria-label="Nearest ancestor target" data-section-index="0">
			<button id="test-target" alt="First Button">
				Click Me
				<img role="icon" src="https://via.placeholder.com/50" />
				<img role="avatar" src="https://via.placeholder.com/150" />
			</button>
			<button id="data-button" data-metric-label="Data metric label" aria-label="Aria label">Click Me</button>
			<button id="aria-button" aria-label="Aria label">Click Me</button>
			<input id="data-input-text" type="text" defaultValue="plain text value" />
			<input id="data-input-password" type="password" defaultValue="p@ssw0rd" />
			<select id="data-input-select" defaultValue="selected option">
				<option value="selected option">Selected Option</option>
				<option value="unselected option">Unselected Option</option>
			</select>
			<ul id="data-list">
				<li>Item</li>
				<li>Item</li>
				<li>Item</li>
				<li>Item</li>
				<li>Item</li>
			</ul>
		</section>
	</article>
);

// Configures analytics, mounts a test app, triggers events, and then returns the mocked log function object
function mountTriggerEvent ({target = defaultTarget, events = leftClick, app = basicApp, ...config} = {}) {
	const {configure} = require('..');
	const log = jest.fn();
	configure(Object.assign({log}, defaultConfig, config));
	const wrapper = mount(app, {attachTo: container});
	const targetNode = typeof target === 'string' ? wrapper.find(target).getDOMNode() : target;
	coerceArray(events).forEach(evt => evt(targetNode));
	wrapper.detach();
	return log;
}

// Emulates a left-click event on a node
function leftClick (node) {
	const evt = new window.MouseEvent('click', {
		bubbles: true,
		button: 0,
		buttons: 1,
		which: 1
	});
	node.dispatchEvent(evt);
}

// Emulates a keydown event on a node
function keydown (node, key = 'enter') {
	const {which, code} = keyMap[key];
	const evt = new window.KeyboardEvent('keydown', {
		bubbles: true,
		keyCode: which,
		which,
		charCode: which,
		key: code,
		code
	});
	if (node.focus) node.focus();
	node.dispatchEvent(evt);
}

export {
	leftClick,
	keydown,
	mountTriggerEvent
};
