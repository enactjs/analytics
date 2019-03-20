import {configure, fetchConfig} from '..';
import * as ilib from '../preset/ilib';
import * as moonstone from '../preset/moonstone';
import * as webos from '../preset/webos';
import * as webostv from '../preset/webostv';

let xhrOpts;
jest.mock('xhr', () => {
	return function (options = {}, callback) {
		xhrOpts = options;
		const cfg = {enabled: true};
		if (options.url === './custom-id.json') cfg.messageId = 'MY_MSG_ID';
		callback(null, {statusCode: 200}, JSON.stringify(cfg));
	};
});
jest.mock('@enact/i18n/ilib/lib/ResBundle', () => {
	return class ResBundle {
		getResObj () {
			return {stringName: 'localized text'};
		}
	};
});
jest.mock('..', () => ({
	fetchConfig: jest.fn(jest.requireActual('..').fetchConfig),
	configure: jest.fn()
}));

describe('preset', () => {
	beforeEach(() => {
		configure.mock.calls.splice(0);
		fetchConfig.mock.calls.splice(0);
		window.PalmSystem = {
			identifier: 'app.test 1000',
			PmLogString: jest.fn()
		};
	});

	describe('#moonstone', () => {
		test('.spottable selector is passed to configure', () => {
			moonstone.configure();
			expect(configure.mock.calls[0][0].selector).toBe('.spottable');
		});
	});

	describe('#ilib', () => {
		test('localized strings are de-translated', () => {
			ilib.configure();
			const format = configure.mock.calls[0][0].format;
			const msg = format({label: 'localized text', otherData: 'something else'});
			expect(msg.otherData).toBe('something else');
			expect(msg.label).toBe('stringName');
		});

		test('calls provided format function before intrinsic format function', () => {
			// remaps message fields to validate it was called
			const customFormat = jest.fn(message => ({
				content: message.label
			}));
			ilib.configure({
				format: customFormat
			});

			const format = configure.mock.calls[0][0].format;
			const msg = format({label: 'localized text'});

			expect(msg.content).toBe('stringName');
		});
	});

	describe('#webos', () => {
		test('disables logging by default', () => {
			webos.configure();
			expect(configure.mock.calls[0][0].enabled).toBeFalsy();
		});
		test('uses pmloglib info-level for logging', () => {
			webos.configure();
			configure.mock.calls[0][0].log({time: Date.now()});
			expect(window.PalmSystem.PmLogString.mock.calls.length).toBe(1);
		});
		test('NL_ENACT id can be changed via messageId within the config file', () => {
			webos.configure({path: './custom-id.json'});
			configure.mock.calls[0][0].log({time: Date.now()});
			expect(window.PalmSystem.PmLogString.mock.calls[0][1]).toBe('MY_MSG_ID');
		});
		test('no app config file is read on non-webOS systems', () => {
			delete window.PalmSystem;
			webos.configure();
			expect(fetchConfig.mock.calls.length).toBe(0);
		});
		test('no app config file is read when appId cannot be determined', () => {
			delete window.PalmSystem.identifier;
			webos.configure();
			expect(fetchConfig.mock.calls.length).toBe(0);
		});
		test('/mnt/lg/cmn_data/whitelist/dr/enact/${appId}.json is default path', () => {
			jest.mock('@enact/webos/application', () => ({fetchAppId: () => 'app.test'}));
			const appId = 'app.test';
			webos.configure();
			expect(xhrOpts.url).toBe(`/mnt/lg/cmn_data/whitelist/dr/enact/${appId}.json`);
		});
		test('can take custom path to XHR config from', () => {
			const path = './configData.json';
			webos.configure({path});
			expect(xhrOpts.url).toBe(path);
		});
	});

	describe('#webostv', () => {
		const {addAll} = require('@enact/core/keymap');
		const keys = {red: 1, blue: 2, green: 3, yellow: 4, cancel: 5};
		addAll(keys);

		test('is a combination of moonstone, ilib, and webos presets', () => {
			const combo = {...moonstone.config, ...ilib.config, ...webos.config};
			webostv.configure();
			Object.keys(combo).forEach(key => {
				expect(configure.mock.calls[0][0][key]).toEqual(combo[key]);
			});
		});
		test('has a keydown handler accepting filtered keys', () => {
			webostv.configure();
			const {filter} = configure.mock.calls[0][0].listeners.keydown;
			Object.keys(keys).forEach(k => {
				expect(filter({keyCode: keys[k]})).toBeTruthy();
			});
		});
		test('has a keydown handler filter rejecting invalid keys', () => {
			webostv.configure();
			const {filter} = configure.mock.calls[0][0].listeners.keydown;
			expect(filter({keyCode: 200})).toBeFalsy();
		});
		test('has a keydown handler adapter that adds keyName', () => {
			webostv.configure();
			const {adapter} = configure.mock.calls[0][0].listeners.keydown;
			Object.keys(keys).forEach(k => {
				expect(adapter({keyCode: keys[k]})).toEqual({keyName: k});
			});
		});
		test('has a keydown handler adapter that returns null on invalid key', () => {
			webostv.configure();
			const {adapter} = configure.mock.calls[0][0].listeners.keydown;
			expect(adapter({keyCode: 200})).toBeNull();
		});
	});
});
