import {mount} from 'enzyme';
import React from 'react';
import {configure} from '..';
import {initContainer, leftClick, enterKeydown} from './utils'
let log, selector, app;

const container = initContainer();

describe('configure', () => {
	beforeEach(() => {
		log = jest.fn();
		selector = '#test-target';
		app = (
			<div>
				<button id="test-target">Click Me</button>
			</div>
		);
	});

	describe('#enabled', () => {
		test('should log clicks on desired selector when true', () => {
			configure({enabled: true, selector, log, idle: false});
			const wrapper = mount(app, {attachTo: container});
			leftClick(wrapper.find(selector).getDOMNode());
			expect(log.mock.calls.length).toBe(1);
		});

		test('should log enter keydown to desired selector when true', () => {
			configure({enabled: true, selector, log, idle: false});
			const wrapper = mount(app, {attachTo: container});
			enterKeydown(wrapper.find(selector).getDOMNode());
			expect(log.mock.calls.length).toBe(1);
		});

		test('should not log clicks on desired selector when false', () => {
			configure({enabled: false, selector, log, idle: false});
			const wrapper = mount(app, {attachTo: container});
			leftClick(wrapper.find(selector).getDOMNode());
			expect(log.mock.calls.length).toBe(0);
		});

		test('should log not enter keydown to desired selector when false', () => {
			configure({enabled: false, selector, log, idle: false});
			const wrapper = mount(app, {attachTo: container});
			enterKeydown(wrapper.find(selector).getDOMNode());
			expect(log.mock.calls.length).toBe(0);
		});
	});

	describe('#selector', () => {
		test.todo('validate default selector of [data-metric-label]');
		test.todo('validate custom selector can be found');
		test.todo('validate selector not found will result in no log');
		test.todo('validate click search closest ancestor');
	});

	describe('#format', () => {
		test.todo('validate click search closest ancestor');
	});

	describe('#exclude', () => {
		test('individudal test', () => {

		});
	});

	describe('#include', () => {
		test('individudal test', () => {

		});
	});

	describe('#filter', () => {
		test('individudal test', () => {

		});
	});

	describe('#log', () => {
		test.todo('');
	});

	describe('#listeners', () => {
		test('individudal test', () => {

		});
	});

	describe('#frameSize', () => {
		test('individudal test', () => {

		});
	});

	describe('#idle', () => {
		test('individudal test', () => {

		});
	});
});
