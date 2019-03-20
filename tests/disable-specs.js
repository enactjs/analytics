import {Job} from '@enact/core/util';
import {disable, enable} from '..';
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

	test('clears any log queue on disable', (done) => {
		// Fill log queue then immediately disable, enable, and then verify
		// there's no logs outputted next idle.
		const clicks = new Array(10).fill(leftClick);
		const events = clicks.concat([disable, enable]);
		const log = mountTriggerEvent({idle: true, events});
		const after = new Job(() => {
			expect(log.mock.calls.length).toBe(0);
			done();
		});
		after.idle();
	});
});
