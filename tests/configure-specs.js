import {mount} from 'enzyme';
import {configure} from '..';
import {
	initContainer,
	leftClick,
	keydown,
	testApp
} from './utils';
let log, selector, app;

const container = initContainer();

describe('configure', () => {
	beforeEach(() => {
		log = jest.fn();
		({selector, app} = testApp());
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
			keydown(wrapper.find(selector).getDOMNode());
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
			keydown(wrapper.find(selector).getDOMNode());
			expect(log.mock.calls.length).toBe(0);
		});
	});

	describe('#selector', () => {
		test.todo('validate default selector of [data-metric-label]');
		test.todo('validate custom selector can be found');
		test.todo('validate selector not found will result in no log');
		test.todo('validate click search closest ancestor when multiple selectors available');
	});

	describe('#format', () => {
		test.todo('validate properties added to payload are logged');
		test.todo('validate properties changed to payload are logged changed');
		test.todo('validate properties removed from payload are not logged');
		test.todo('validate different object returned replaces payload');
	});

	describe('#exclude', () => {
		test.todo('validate non-existant key does not prevent the log output');
		test.todo('validate existing key, which does not string match, allows log entry in output');
		test.todo('validate existing key, which does not match within string array, allows log entry in output');
		test.todo('validate existing key, which has a string match, excludes log entry from output');
		test.todo('validate existing key, which has a match within string array, excludes log entry from output');
	});

	describe('#include', () => {
		test.todo('validate non-existant key does not allow the log output');
		test.todo('validate existing key, which does not string match, excludes log entry from output');
		test.todo('validate existing key, which does not match within string array, excludes log entry from output');
		test.todo('validate existing key, which has a string match, allows log entry in output');
		test.todo('validate existing key, which has a match within string array, allows log entry in output');
	});

	describe('#filter', () => {
		test.todo('validate falsey return prevents log output');
		test.todo('validate truthy return allows log output');
	});

	describe('#log', () => {
		test.todo('validate `time` property in message is a number');
		test.todo('validate `time` property in message is parsable in Date');
		test.todo('validate `type` property corresponds to the event type');
		test.todo('validate `label` property is "global" when target is document or document.body');
		test.todo('validate `label` resolves to data-metric-label attribute when found');
		test.todo('validate `label` resolves to aria-label attribute when data-metric-label is not found');
		test.todo('validate `label` resolves to inner text content when neither data-metric-label nor aria-label are found');
	});

	describe('#listeners', () => {
		test.todo('validate listens and logs for all events in string array');
		test.todo('validate listens and logs for object entries by property names');
		test.todo('validate listens and logs for object entries, with filter narrowing results processed');
		test.todo('validate listens and logs for object entries, with adapter that returns nothing');
		test.todo('validate listens and logs for object entries, with adapter that provides additional data');
	});

	describe('#frameSize', () => {
		test.todo('validate log flushing stops after log frame size time limit is reached');
	});

	describe('#idle', () => {
		test.todo('validate log flushing occurs immediately when `idle` is false');
		test.todo('validate log flushing waits for system idle state when`idle` is true');
	});
});
