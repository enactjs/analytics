/* eslint no-console: "off" */
import {fetchConfig}  from '..';
import {mountTriggerEvent, leftClick} from './utils';

let xhrOpts;

jest.mock('xhr', () => {
	return function (options = {}, callback) {
		xhrOpts = options;
		const code = options.resp ? options.resp.statusCode : 200;
		if (options.beforeSend) {
			options.beforeSend({response: options.raw, status: code});
		}
		callback(
			options.err || null,
			Object.assign({statusCode: 200}, options.resp),
			options.raw || JSON.stringify({enabled: true})
		);
	};
});

describe('fetchConfig', () => {
	beforeEach(() => (xhrOpts = null));

	test('url is passed to xhr correctly for fetching', () => {
		const dummyUrl = 'http://example.com';
		fetchConfig(dummyUrl);
		expect(xhrOpts.url).toBe(dummyUrl);
	});
	test('custom additional options are passed to xhr', () => {
		fetchConfig('http://example.com', {sync:true});
		expect(xhrOpts.sync).toBeTruthy();
	});

	test('erroneously-failed file:// xhr operations should succeed', () => {
		const raw = JSON.stringify({enabled: true});
		const err = new Error('File XHR False-Failure');
		const resp = {statusCode: 0};
		const doFetch = () => fetchConfig(null, {raw, resp, err});
		const log = mountTriggerEvent({enabled: false, events: [doFetch, leftClick]});
		expect(log.mock.calls.length).toBe(1);
	});

	test('failed xhr operations should return early and output error', () => {
		const consoleError = console.error;
		console.error = jest.fn();
		const err = new Error('Failed XHR');
		const parse = jest.fn(o => JSON.parse(o));
		fetchConfig(null, {err, parse});
		expect(console.error.mock.calls.length).toBe(1);
		console.error = consoleError;
		expect(parse.mock.calls.length).toBe(0);
	});

	test('config files get applied to analytics once read via standard JSON parsing', () => {
		const doFetch = () => fetchConfig('http://example.com');
		const log = mountTriggerEvent({enabled: false, events: [doFetch, leftClick]});
		expect(log.mock.calls.length).toBe(1);
	});
	test('custom parser receives the raw text', () => {
		const raw = JSON.stringify({enabled: true});
		const parse = jest.fn(o => JSON.parse(o));
		fetchConfig('http://example.com', {parse, raw});
		expect(parse.mock.calls[0][0]).toBe(raw);
	});
	test('custom parser can custom-parse raw text and what\'s returned is used in config', () => {
		const raw = 'enabled:true';
		const parse = o => {
			const tok = o.split(':');
			return {[tok[0]]: Boolean(tok[1])};
		};
		const doFetch = () => fetchConfig('http://example.com', {parse, raw});
		const log = mountTriggerEvent({enabled: false, events: [doFetch, leftClick]});
		expect(log.mock.calls.length).toBe(1);
	});

	test('failed raw parsing should return early and output error', () => {
		const consoleError = console.error;
		console.error = jest.fn();
		const parse = jest.fn(() => {
			throw new Error('Parse Failed');
		});
		const doFetch = () => fetchConfig(null, {parse});
		const log = mountTriggerEvent({enabled: false, events: [doFetch, leftClick]});
		expect(console.error.mock.calls.length).toBe(2);
		console.error = consoleError;
		expect(log.mock.calls.length).toBe(0);
	});

	test('environment without xmlhttprequest should throw', () => {
		// Uses `warning` to report non-web environment
		// In Jest non-production environment, results in throwing error
		expect(() => {
			const globalXHR = global.XMLHttpRequest;
			delete global.XMLHttpRequest;
			try {
				fetchConfig();
				global.XMLHttpRequest = globalXHR;
			} catch (e) {
				global.XMLHttpRequest = globalXHR;
				throw e;
			}
		}).toThrow();
	});
});
