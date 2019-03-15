import {disable} from '..';
import {mountTriggerEvent, leftClick} from './utils';

describe('disable', () => {
	test('turns off logging when previously enabled', () => {
		const log = mountTriggerEvent({enabled: true, events: [disable, leftClick]});
		expect(log.mock.calls.length).toBe(0);
	});
	test('leaves logging off when previously disabled', () => {
		const log = mountTriggerEvent({enabled: false, events: [disable, leftClick]});
		expect(log.mock.calls.length).toBe(0);
	});
});
