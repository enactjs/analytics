import {log as logger, configure} from '..';

describe('log', () => {
	test('imperatively pass log extries into the analytics system', () => {
		const log = jest.fn();
		configure({enabled:true, log, rules: [{}], idle: false});
		logger({customData: true, target: document});
		expect(log.mock.calls[0][0].customData).toBeTruthy();
	});
});
