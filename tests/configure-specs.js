import {Job} from '@enact/core/util';
import {leftClick, keydown, mountTriggerEvent} from './utils';

describe('configure', () => {
	// Ensure fresh instance of analytics with untouch default values
	beforeEach(() => jest.resetModules());

	describe('#enabled', () => {

		test('should log clicks on desired selector when true', () => {
			const log = mountTriggerEvent();
			expect(log.mock.calls.length).toBe(1);
		});

		test('should log enter keydown to desired selector when true', () => {
			const log = mountTriggerEvent({events: keydown});
			expect(log.mock.calls.length).toBe(1);
		});

		test('should not log clicks on desired selector when false', () => {
			const log = mountTriggerEvent({enabled: false});
			expect(log.mock.calls.length).toBe(0);
		});

		test('should log not enter keydown to desired selector when false', () => {
			const log = mountTriggerEvent({enabled: false, events: keydown});
			expect(log.mock.calls.length).toBe(0);
		});
	});

	describe('#selector', () => {
		test('default selector of [data-metric-label]', () => {
			const log = mountTriggerEvent({selector: null, target: '[data-metric-label]'});
			expect(log.mock.calls.length).toBe(1);
		});
		test('custom selector can be found', () => {
			const log = mountTriggerEvent();
			expect(log.mock.calls.length).toBe(1);
		});
		test('when not found, will result in no log', () => {
			const log = mountTriggerEvent({selector: '[does-not-exist]'});
			expect(log.mock.calls.length).toBe(0);
		});
		test('searchs closest ancestor', () => {
			const log = mountTriggerEvent({selector: '[data-parent-target]'});
			expect(log.mock.calls[0][0].label).toBe('Nearest ancestor target');
		});
	});

	describe('#exclude', () => {
		test('non-existant key does not prevent the log output', () => {
			const exclude = {unusedProp: 'test'};
			const log = mountTriggerEvent({rules: [{exclude}]});
			expect(log.mock.calls.length).toBe(1);
		});
		test('existing key, which does not string match, allows log entry in output', () => {
			const exclude = {label: 'unused'};
			const log = mountTriggerEvent({rules: [{exclude}]});
			expect(log.mock.calls.length).toBe(1);
		});
		test('existing key, which does not match within string array, allows log entry in output', () => {
			const exclude = {label: ['unused1', 'unused2']};
			const log = mountTriggerEvent({rules: [{exclude}]});
			expect(log.mock.calls.length).toBe(1);
		});
		test('existing key, which has a string match, excludes log entry from output', () => {
			const exclude = {label: 'Aria'};
			const log = mountTriggerEvent({rules: [{exclude}], target: '#aria-button'});
			expect(log.mock.calls.length).toBe(0);
		});
		test('validate existing key, which has a match within string array, excludes log entry from output', () => {
			const exclude = {label: ['Aria', 'Other']};
			const log = mountTriggerEvent({rules: [{exclude}], target: '#aria-button'});
			expect(log.mock.calls.length).toBe(0);
		});
	});

	describe('#include', () => {
		test('non-existant key does not allow the log output', () => {
			const include = {unusedProp: 'test'};
			const log = mountTriggerEvent({rules: [{include}]});
			expect(log.mock.calls.length).toBe(0);
		});
		test('existing key, which does not string match, excludes log entry from output', () => {
			const include = {label: 'unused'};
			const log = mountTriggerEvent({rules: [{include}]});
			expect(log.mock.calls.length).toBe(0);
		});
		test('existing key, which does not match within string array, excludes log entry from output', () => {
			const include = {label: ['unused1', 'unused2']};
			const log = mountTriggerEvent({rules: [{include}]});
			expect(log.mock.calls.length).toBe(0);
		});
		test('existing key, which has a string match, allows log entry in output', () => {
			const include = {label: 'Aria'};
			const log = mountTriggerEvent({rules: [{include}], target: '#aria-button'});
			expect(log.mock.calls.length).toBe(1);
		});
		test('existing key, which has a match within string array, allows log entry in output', () => {
			const include = {label: ['Aria', 'Other']};
			const log = mountTriggerEvent({rules: [{include}], target: '#aria-button'});
			expect(log.mock.calls.length).toBe(1);
		});
	});

	describe('#filter', () => {
		test('falsey return prevents log output', () => {
			const filter = () => false;
			const log = mountTriggerEvent({rules: [{filter}]});
			expect(log.mock.calls.length).toBe(0);
		});
		test('truthy return allows log output', () => {
			const filter = () => true;
			const log = mountTriggerEvent({rules: [{filter}]});
			expect(log.mock.calls.length).toBe(1);
		});
	});

	describe('#format', () => {
		test('properties added to message are logged', () => {
			const format = msg => {
				msg.newProp = 123;
				return msg;
			};
			const log = mountTriggerEvent({format});
			expect(log.mock.calls[0][0].newProp).toBe(123);
		});
		test('properties changed in the message are logged changed', () => {
			const newTime = Date.now();
			const format = msg => {
				msg.time = newTime;
				return msg;
			};
			const log = mountTriggerEvent({format});
			expect(log.mock.calls[0][0].time).toBe(newTime);
		});
		test('properties removed from message are not logged', () => {
			const format = msg => {
				delete msg.time;
				return msg;
			};
			const log = mountTriggerEvent({format});
			expect(log.mock.calls[0][0].time).toBeUndefined();
		});
		test('different object returned replaces message', () => {
			const newObj = {customData: true, time: Date.now()};
			const format = () => newObj;
			const log = mountTriggerEvent({format});
			expect(log.mock.calls[0][0]).toEqual(newObj);
		});
	});

	describe('#log', () => {
		test('time property in message is a number', () => {
			const log = mountTriggerEvent();
			expect(typeof log.mock.calls[0][0].time).toBe('number');
		});
		test('time property in message is parsable in Date', () => {
			const log = mountTriggerEvent();
			expect(() => new Date(log.mock.calls[0][0].time)).not.toThrow();
		});
		test('type property corresponds to the event type', () => {
			const log = mountTriggerEvent();
			expect(log.mock.calls[0][0].type).toBe('click');
		});
		test('label property is "global" when target is document', () => {
			const log = mountTriggerEvent({target: document, events: keydown});
			expect(log.mock.calls[0][0].label).toBe('global');
		});
		test('label property is "global" when target is document.body', () => {
			const log = mountTriggerEvent({target: document.body, events: keydown});
			expect(log.mock.calls[0][0].label).toBe('global');
		});
		test('label resolves to data-metric-label attribute when found', () => {
			const selector = '#data-button';
			const log = mountTriggerEvent({selector, target: selector});
			expect(log.mock.calls[0][0].label).toBe('Data metric label');
		});
		test('label resolves to aria-label attribute when data-metric-label is not found', () => {
			const selector = '#aria-button';
			const log = mountTriggerEvent({selector, target: selector});
			expect(log.mock.calls[0][0].label).toBe('Aria label');
		});
		test('label resolves to text content when neither data-metric-label nor aria-label are found', () => {
			const log = mountTriggerEvent();
			expect(log.mock.calls[0][0].label).toBe('Click Me');
		});
	});

	describe('#listeners', () => {
		const auxclick = node => node.dispatchEvent(new window.MouseEvent('auxclick'));
		const myevent = node => node.dispatchEvent(new window.CustomEvent('myevent'));
		const escapeKey = node => keydown(node, 'escape');
		const spaceKey = node => keydown(node, 'space');

		test('listens and logs for all events in string array', () => {
			const listeners = ['auxclick', 'myevent'];
			const log = mountTriggerEvent({listeners, events: [auxclick, myevent]});
			expect(log.mock.calls.length).toBe(2);
		});
		test('listens and logs for object entries by property names', () => {
			const listeners = {auxclick: {}, 'myevent': {}};
			const log = mountTriggerEvent({listeners, events: [auxclick, myevent]});
			expect(log.mock.calls.length).toBe(2);
		});
		test('listens and logs for object entries, with filter narrowing results processed', () => {
			const listeners = {
				keydown: {
					filter: ev => ev.keyCode === 27 // Escape key only
				}
			};
			const log = mountTriggerEvent({listeners, events:[escapeKey, spaceKey]});
			expect(log.mock.calls.length).toBe(1);
		});
		test('listens and logs for object entries, with adapter that returns falsely', () => {
			const listeners = {
				myevent: {
					adapter: () => null
				}
			};
			const log = mountTriggerEvent({listeners, events: myevent});
			expect(log.mock.calls.length).toBe(1);
		});
		test('listens and logs for object entries, with adapter that provides additional data', () => {
			const listeners = {
				myevent: {
					adapter: () => ({detail: 1})
				}
			};
			const log = mountTriggerEvent({listeners, events: myevent});
			expect(log.mock.calls.length).toBe(1);
			expect(log.mock.calls[0][0].detail).toBe(1);
		});
	});

	describe('#frameSize', () => {
		test('validate log flushing stops after log frame size time limit is reached', done => {
			const events = new Array(10).fill(leftClick);
			const log = jest.fn(() => {
				// make each log take 10ms so we trip the frameSize limit after roughly 5 entries
				const endBy = Date.now() + 10;
				while (Date.now() < endBy);
			});
			mountTriggerEvent({log, idle: true, frameSize: 50, events});
			const after = new Job(() => {
				expect(log.mock.calls.length).toBeGreaterThan(0);
				expect(log.mock.calls.length).toBeLessThan(events.length);
				done();
			});
			after.idle();
		});
	});

	describe('#idle', () => {
		test('log flushing occurs immediately when `idle` is false', () => {
			const log = mountTriggerEvent({idle: false});
			expect(log.mock.calls.length).toBe(1);
		});
		test('log flushing waits for system idle state when `idle` is true', done => {
			const log = mountTriggerEvent({idle: true});
			expect(log.mock.calls.length).toBe(0);
			const after = new Job(() => {
				expect(log.mock.calls.length).toBe(1);
				done();
			});
			after.idle();
		});
	});
});
