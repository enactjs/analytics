import {enable} from '..';
import {mountTriggerEvent, leftClick} from './utils';

describe('enable', () => {
	test('turns on logging when previously disabled', () => {
		const log = mountTriggerEvent({enabled: false, events: [enable, leftClick]});
		expect(log.mock.calls.length).toBe(1);
	});
	test('leaves logging on when previously enabled', () => {
		const log = mountTriggerEvent({enabled: true, events: [enable, leftClick]});
		expect(log.mock.calls.length).toBe(1);
	});
});
