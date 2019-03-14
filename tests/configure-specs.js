import {Job} from '@enact/core/util';
import {mount} from 'enzyme';
import {
	initContainer,
	leftClick,
	keydown,
	testApp as app
} from './utils';
let configure, wrapper, log, selector;

const container = initContainer();
const defaultTarget = '#test-target';

describe('configure', () => {
	beforeEach(() => {
		// Ensure fresh instance of analytics with untouch default values
		jest.resetModules();
		({configure} = require('..'));
		log = jest.fn();
		selector = 'button';
	});

	afterEach(() => {
		if (wrapper) wrapper.detach();
	});

	describe('#enabled', () => {
		test('should log clicks on desired selector when true', () => {
			configure({enabled: true, selector, log, idle: false});
			wrapper = mount(app, {attachTo: container});
			leftClick(wrapper.find(defaultTarget).getDOMNode());
			expect(log.mock.calls.length).toBe(1);
		});

		test('should log enter keydown to desired selector when true', () => {
			configure({enabled: true, selector, log, idle: false});
			wrapper = mount(app, {attachTo: container});
			keydown(wrapper.find(defaultTarget).getDOMNode());
			expect(log.mock.calls.length).toBe(1);
		});

		test('should not log clicks on desired selector when false', () => {
			configure({enabled: false, selector, log, idle: false});
			wrapper = mount(app, {attachTo: container});
			leftClick(wrapper.find(defaultTarget).getDOMNode());
			expect(log.mock.calls.length).toBe(0);
		});

		test('should log not enter keydown to desired selector when false', () => {
			configure({enabled: false, selector, log, idle: false});
			wrapper = mount(app, {attachTo: container});
			keydown(wrapper.find(defaultTarget).getDOMNode());
			expect(log.mock.calls.length).toBe(0);
		});
	});

	describe('#selector', () => {
		test('default selector of [data-metric-label]', () => {
			configure({enabled: true, log, idle: false});
			wrapper = mount(app, {attachTo: container});
			leftClick(wrapper.find('[data-metric-label]').getDOMNode());
			expect(log.mock.calls.length).toBe(1);
		});
		test('custom selector can be found', () => {
			configure({enabled: true, selector, log, idle: false});
			wrapper = mount(app, {attachTo: container});
			leftClick(wrapper.find(defaultTarget).getDOMNode());
			expect(log.mock.calls.length).toBe(1);
		});
		test('when not found, will result in no log', () => {
			configure({enabled: true, selector: '[does-not-exist]', log, idle: false});
			wrapper = mount(app, {attachTo: container});
			leftClick(wrapper.find(defaultTarget).getDOMNode());
			expect(log.mock.calls.length).toBe(0);
		});
		test('searchs closest ancestor', () => {
			configure({enabled: true, selector: '[data-parent-target]', log, idle: false});
			wrapper = mount(app, {attachTo: container});
			leftClick(wrapper.find(defaultTarget).getDOMNode());
			expect(log.mock.calls[0][0].label).toBe('Nearest ancestor target');
		});
	});

	describe('#exclude', () => {
		test('non-existant key does not prevent the log output', () => {
			const exclude = {unusedProp: 'test'};
			configure({enabled: true, selector, log, exclude, idle: false});
			wrapper = mount(app, {attachTo: container});
			leftClick(wrapper.find(defaultTarget).getDOMNode());
			expect(log.mock.calls.length).toBe(1);
		});
		test('existing key, which does not string match, allows log entry in output', () => {
			const exclude = {label: 'unused'};
			configure({enabled: true, selector, log, exclude, idle: false});
			wrapper = mount(app, {attachTo: container});
			leftClick(wrapper.find(defaultTarget).getDOMNode());
			expect(log.mock.calls.length).toBe(1);
		});
		test('existing key, which does not match within string array, allows log entry in output', () => {
			const exclude = {label: ['unused1', 'unused2']};
			configure({enabled: true, selector, log, exclude, idle: false});
			wrapper = mount(app, {attachTo: container});
			leftClick(wrapper.find(defaultTarget).getDOMNode());
			expect(log.mock.calls.length).toBe(1);
		});
		test('existing key, which has a string match, excludes log entry from output', () => {
			const exclude = {label: 'Aria'};
			configure({enabled: true, selector, log, exclude, idle: false});
			wrapper = mount(app, {attachTo: container});
			leftClick(wrapper.find('#aria-button').getDOMNode());
			expect(log.mock.calls.length).toBe(0);
		});
		test('validate existing key, which has a match within string array, excludes log entry from output', () => {
			const exclude = {label: ['Aria', 'Other']};
			configure({enabled: true, selector, log, exclude, idle: false});
			wrapper = mount(app, {attachTo: container});
			leftClick(wrapper.find('#aria-button').getDOMNode());
			expect(log.mock.calls.length).toBe(0);
		});
	});

	describe('#include', () => {
		test('non-existant key does not allow the log output', () => {
			const include = {unusedProp: 'test'};
			configure({enabled: true, selector, log, include, idle: false});
			wrapper = mount(app, {attachTo: container});
			leftClick(wrapper.find(defaultTarget).getDOMNode());
			expect(log.mock.calls.length).toBe(0);
		});
		test('existing key, which does not string match, excludes log entry from output', () => {
			const include = {label: 'unused'};
			configure({enabled: true, selector, log, include, idle: false});
			wrapper = mount(app, {attachTo: container});
			leftClick(wrapper.find(defaultTarget).getDOMNode());
			expect(log.mock.calls.length).toBe(0);
		});
		test('existing key, which does not match within string array, excludes log entry from output', () => {
			const include = {label: ['unused1', 'unused2']};
			configure({enabled: true, selector, log, include, idle: false});
			wrapper = mount(app, {attachTo: container});
			leftClick(wrapper.find(defaultTarget).getDOMNode());
			expect(log.mock.calls.length).toBe(0);
		});
		test('existing key, which has a string match, allows log entry in output', () => {
			const include = {label: 'Aria'};
			configure({enabled: true, selector, log, include, idle: false});
			wrapper = mount(app, {attachTo: container});
			leftClick(wrapper.find('#aria-button').getDOMNode());
			expect(log.mock.calls.length).toBe(1);
		});
		test('existing key, which has a match within string array, allows log entry in output', () => {
			const include = {label: ['Aria', 'Other']};
			configure({enabled: true, selector, log, include, idle: false});
			wrapper = mount(app, {attachTo: container});
			leftClick(wrapper.find('#aria-button').getDOMNode());
			expect(log.mock.calls.length).toBe(1);
		});
	});

	describe('#filter', () => {
		test('falsey return prevents log output', () => {
			const filter = () => false;
			configure({enabled: true, selector, log, filter, idle: false});
			wrapper = mount(app, {attachTo: container});
			leftClick(wrapper.find(defaultTarget).getDOMNode());
			expect(log.mock.calls.length).toBe(0);
		});
		test('truthy return allows log output', () => {
			const filter = () => true;
			configure({enabled: true, selector, log, filter, idle: false});
			wrapper = mount(app, {attachTo: container});
			leftClick(wrapper.find(defaultTarget).getDOMNode());
			expect(log.mock.calls.length).toBe(1);
		});
	});

	describe('#format', () => {
		test('properties added to message are logged', () => {
			const format = msg => {
				msg.newProp = 123;
				return msg;
			};
			configure({enabled: true, selector, log, format, idle: false});
			wrapper = mount(app, {attachTo: container});
			leftClick(wrapper.find(defaultTarget).getDOMNode());
			expect(log.mock.calls[0][0].newProp).toBe(123);
		});
		test('properties changed in the message are logged changed', () => {
			const newTime = Date.now();
			const format = msg => {
				msg.time = newTime;
				return msg;
			};
			configure({enabled: true, selector, log, format, idle: false});
			wrapper = mount(app, {attachTo: container});
			leftClick(wrapper.find(defaultTarget).getDOMNode());
			expect(log.mock.calls[0][0].time).toBe(newTime);
		});
		test('properties removed from message are not logged', () => {
			const format = msg => {
				delete msg.time;
				return msg;
			};
			configure({enabled: true, selector, log, format, idle: false});
			wrapper = mount(app, {attachTo: container});
			leftClick(wrapper.find(defaultTarget).getDOMNode());
			expect(log.mock.calls[0][0].time).toBeUndefined();
		});
		test('different object returned replaces message', () => {
			const newObj = {customData: true, time: Date.now()};
			const format = () => newObj;
			configure({enabled: true, selector, log, format, idle: false});
			wrapper = mount(app, {attachTo: container});
			leftClick(wrapper.find(defaultTarget).getDOMNode());
			expect(log.mock.calls[0][0]).toEqual(newObj);
		});
	});

	describe('#log', () => {
		test('time property in message is a number', () => {
			configure({enabled: true, selector, log, idle: false});
			wrapper = mount(app, {attachTo: container});
			leftClick(wrapper.find(defaultTarget).getDOMNode());
			expect(typeof log.mock.calls[0][0].time).toBe('number');
		});
		test('time property in message is parsable in Date', () => {
			configure({enabled: true, selector, log, idle: false});
			wrapper = mount(app, {attachTo: container});
			leftClick(wrapper.find(defaultTarget).getDOMNode());
			new Date(log.mock.calls[0][0].time);
		});
		test('type property corresponds to the event type', () => {
			configure({enabled: true, selector, log, idle: false});
			wrapper = mount(app, {attachTo: container});
			leftClick(wrapper.find(defaultTarget).getDOMNode());
			expect(log.mock.calls[0][0].type).toBe('click');
		});
		test('label property is "global" when target is document', () => {
			configure({enabled: true, selector, log, idle: false});
			wrapper = mount(app, {attachTo: container});
			keydown(document);
			expect(log.mock.calls[0][0].label).toBe('global');
		});
		test('label property is "global" when target is document.body', () => {
			configure({enabled: true, selector, log, idle: false});
			wrapper = mount(app, {attachTo: container});
			keydown(document.body);
			expect(log.mock.calls[0][0].label).toBe('global');
		});
		test('label resolves to data-metric-label attribute when found', () => {
			selector = '#data-button';
			configure({enabled: true, selector, log, idle: false});
			wrapper = mount(app, {attachTo: container});
			leftClick(wrapper.find(selector).getDOMNode());
			expect(log.mock.calls[0][0].label).toBe('Data metric label');
		});
		test('label resolves to aria-label attribute when data-metric-label is not found', () => {
			selector = '#aria-button';
			configure({enabled: true, selector, log, idle: false});
			wrapper = mount(app, {attachTo: container});
			leftClick(wrapper.find(selector).getDOMNode());
			expect(log.mock.calls[0][0].label).toBe('Aria label');
		});
		test('label resolves to text content when neither data-metric-label nor aria-label are found', () => {
			configure({enabled: true, selector, log, idle: false});
			wrapper = mount(app, {attachTo: container});
			leftClick(wrapper.find(defaultTarget).getDOMNode());
			expect(log.mock.calls[0][0].label).toBe('Click Me');
		});
	});

	describe('#listeners', () => {
		test.todo('validate listens and logs for all events in string array');
		test.todo('validate listens and logs for object entries by property names');
		test.todo('validate listens and logs for object entries, with filter narrowing results processed');
		test.todo('validate listens and logs for object entries, with adapter that returns nothing');
		test.todo('validate listens and logs for object entries, with adapter that provides additional data');
	});

	describe('#frameSize', () => {
		test('validate log flushing stops after log frame size time limit is reached', done => {
			const count = 10;
			log = jest.fn(() => {
				// make each log take 10ms so we trip the frameSize limit after roughly 5 entries
				const endBy = Date.now() + 10;
				while(Date.now() < endBy);
			});
			configure({enabled: true, selector, log, idle: true, frameSize:50});
			wrapper = mount(app, {attachTo: container});
			for(let k=0; k<count; k++) leftClick(wrapper.find(defaultTarget).getDOMNode());
			const after = new Job(() => {
				expect(log.mock.calls.length).toBeGreaterThan(0);
				expect(log.mock.calls.length).toBeLessThan(count);
				done();
			});
			after.idle();
		});
	});

	describe('#idle', () => {
		test('log flushing occurs immediately when `idle` is false', () => {
			configure({enabled: true, selector, log, idle: false});
			wrapper = mount(app, {attachTo: container});
			leftClick(wrapper.find(defaultTarget).getDOMNode());
			expect(log.mock.calls.length).toBe(1);
		});
		test('log flushing waits for system idle state when`idle` is true', done => {
			configure({enabled: true, selector, log, idle: true});
			wrapper = mount(app, {attachTo: container});
			leftClick(wrapper.find(defaultTarget).getDOMNode());
			expect(log.mock.calls.length).toBe(0);
			const after = new Job(() => {
				expect(log.mock.calls.length).toBe(1);
				done();
			});
			after.idle();
		});
	});
});
