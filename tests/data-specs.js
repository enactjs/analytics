import {mountTriggerEvent} from './utils';

describe('configure data', () => {
	// Ensure fresh instance of analytics with untouch default values
	beforeEach(() => jest.resetModules());

	describe('#attribute', () => {
		test('base case of a simple <text> pseudo-attribute', () => {
			const cfg = {
				rules: [
					{
						data: {
							innerText: '<text>'
						}
					}
				]
			};
			const log = mountTriggerEvent({...cfg, target: '#data-button'});
			expect(log.mock.calls[0][0].innerText).toBe('Click Me');
		});
		test('base case of a simple attribute selector', () => {
			const cfg = {
				rules: [
					{
						data: {
							altLabel: '@alt'
						}
					}
				]
			};
			const log = mountTriggerEvent(cfg);
			expect(log.mock.calls[0][0].altLabel).toBe('First Button');
		});
		test('base case of a simple value selector with nothing else', () => {
			// Special edge case of no selector nor closest in object format
			const cfg = {
				rules: [
					{
						data: {
							altLabel: {
								value: '@alt'
							}
						}
					}
				]
			};
			const log = mountTriggerEvent(cfg);
			expect(log.mock.calls[0][0].altLabel).toBe('First Button');
		});
		test('base case of a simple <value> pseudo-attribute', () => {
			const cfg = {
				rules: [
					{
						data: {
							innerText: '<value>'
						}
					}
				]
			};
			const log = mountTriggerEvent({...cfg, target: '#data-input-text'});
			expect(log.mock.calls[0][0].innerText).toBe('plain text value');
		});
		test('base case of a simple <value> pseudo-attribute on <select>', () => {
			const cfg = {
				rules: [
					{
						data: {
							innerText: '<value>'
						}
					}
				]
			};
			const log = mountTriggerEvent({...cfg, target: '#data-input-select'});
			expect(log.mock.calls[0][0].innerText).toBe('selected option');
		});
		test('base case of a simple <value> pseudo-attribute on password field', () => {
			const cfg = {
				rules: [
					{
						data: {
							innerText: '<value>'
						}
					}
				]
			};
			const log = mountTriggerEvent({...cfg, target: '#data-input-password'});
			expect(log.mock.calls[0][0].innerText).not.toBeDefined();
		});
		test('base case of <count> pseudo-attribute', () => {
			const cfg = {
				rules: [
					{
						data: {
							count: {
								selector: 'li',
								value: '<count>'
							}
						}
					}
				]
			};
			const log = mountTriggerEvent({...cfg, target: '#data-list'});
			expect(log.mock.calls[0][0].count).toBe(5);
		});
		test('base case of <count> pseudo-attribute with closest', () => {
			const cfg = {
				rules: [
					{
						data: {
							count: {
								closest: 'section',
								value: '<count>'
							}
						}
					}
				]
			};
			const log = mountTriggerEvent({...cfg, target: '#data-list'});
			expect(log.mock.calls[0][0].count).toBe(1);
		});
		test('advanced case of <count> pseudo-attribute with not found closest', () => {
			const cfg = {
				rules: [
					{
						data: {
							count: {
								closest: 'does-not-exist',
								value: '<count>'
							}
						}
					}
				]
			};
			const log = mountTriggerEvent({...cfg, target: '#data-list'});
			expect(log.mock.calls[0][0].count).toBe(0);
		});
		test('advanced case of <count> pseudo-attribute with not found closest and value selector', () => {
			const cfg = {
				rules: [
					{
						data: {
							count: {
								closest: 'does-not-exist',
								value: {
									selector: 'section',
									value: '<count>'
								}
							}
						}
					}
				]
			};
			const log = mountTriggerEvent({...cfg, target: '#data-list'});
			expect(log.mock.calls[0][0].count).toBeUndefined();
		});
		test('advanced case of a object <text> value', () => {
			const cfg = {
				rules: [
					{
						data: {
							sectionTitle: {
								selector: 'header h1',
								value: '<text>'
							}
						}
					}
				]
			};
			const log = mountTriggerEvent({...cfg, selector: 'article'});
			expect(log.mock.calls[0][0].sectionTitle).toBe('Header Text');
		});
		test('advanced case of a object attribute value', () => {
			const cfg = {
				rules: [
					{
						data: {
							sectionIndex: {
								closest: 'section',
								value: '@data-section-index'
							}
						}
					}
				]
			};
			const log = mountTriggerEvent(cfg);
			expect(log.mock.calls[0][0].sectionIndex).toBe('0');
		});
		test('advanced case of a array of resolver strings, returning first match', () => {
			const cfg = {
				rules: [
					{
						data: {
							id: ['@id', '@data-spotlight-id', '@data-component-id']
						}
					}
				]
			};
			const log = mountTriggerEvent(cfg);
			expect(log.mock.calls[0][0].id).toBe('test-target');
		});
		test('advanced case of a array of resolver value objects, returning first match', () => {
			const cfg = {
				rules: [
					{
						data: {
							sectionIndex: [
								{
									closest: 'p',
									value: '@data-section-index'
								},
								{
									closest: 'section',
									value: '@data-section-index'
								}
							]
						}
					}
				]
			};
			const log = mountTriggerEvent(cfg);
			expect(log.mock.calls[0][0].sectionIndex).toBe('0');
		});
	});

	describe('#value', () => {
		test('base case of a string', () => {
			const cfg = {
				rules: [
					{
						data: {
							innerText: 'static value'
						}
					}
				]
			};
			const log = mountTriggerEvent({...cfg, target: '#data-button'});
			expect(log.mock.calls[0][0].innerText).toBe('static value');
		});
		test('base case of a object', () => {
			const cfg = {
				rules: [
					{
						data: {
							innerText: {
								value: 'static value'
							}
						}
					}
				]
			};
			const log = mountTriggerEvent({...cfg, target: '#data-button'});
			expect(log.mock.calls[0][0].innerText).toBe('static value');
		});
	});

	describe('#closest', () => {
		test('base case of using closest where data is found', () => {
			const cfg = {
				rules: [
					{
						data: {
							sectionIndex: {
								closest: 'section',
								value: '@data-section-index'
							}
						}
					}
				]
			};
			const log = mountTriggerEvent(cfg);
			expect(log.mock.calls[0][0].sectionIndex).toBe('0');
		});
		test('base case of using closest with value where data is found', () => {
			const cfg = {
				rules: [
					{
						data: {
							innerText: {
								closest: 'section',
								value: 'static value'
							}
						}
					}
				]
			};
			const log = mountTriggerEvent(cfg);
			expect(log.mock.calls[0][0].innerText).toBe('static value');
		});
		test('base case of using closest where nothing is found', () => {
			const cfg = {
				rules: [
					{
						data: {
							sectionIndex: {
								closest: 'p',
								value: '@data-section-index'
							}
						}
					}
				]
			};
			const log = mountTriggerEvent(cfg);
			expect(log.mock.calls[0][0].sectionIndex).toBeUndefined();
		});
	});

	describe('#selector', () => {
		test('base case of using selector where data is found', () => {
			const cfg = {
				rules: [
					{
						data: {
							iconUrl: {
								selector: '[role=icon]',
								value: '@src'
							}
						}
					}
				]
			};
			const log = mountTriggerEvent(cfg);
			expect(log.mock.calls[0][0].iconUrl).toBe('https://via.placeholder.com/50');
		});
		test('base case of using selector with value where data is found', () => {
			const cfg = {
				rules: [
					{
						data: {
							iconUrl: {
								selector: '[role=icon]',
								value: 'static value'
							}
						}
					}
				]
			};
			const log = mountTriggerEvent(cfg);
			expect(log.mock.calls[0][0].iconUrl).toBe('static value');
		});
		test('base case of using selector where nothing is found', () => {
			const cfg = {
				rules: [
					{
						data: {
							iconUrl: {
								selector: '[role=other]',
								value: '@src'
							}
						}
					}
				]
			};
			const log = mountTriggerEvent(cfg);
			expect(log.mock.calls[0][0].iconUrl).toBeUndefined();
		});
	});

	describe('#matches', () => {
		test('base case of using matches where data is found', () => {
			const cfg = {
				rules: [
					{
						data: {
							iconUrl: {
								matches: '[alt]', // matches #test-target, which has alt attribute
								selector: 'img',
								value: '@src'
							}

						}
					}
				]
			};
			const log = mountTriggerEvent(cfg);
			expect(log.mock.calls[0][0].iconUrl).toBe('https://via.placeholder.com/50');
		});
		test('base case of using matches where nothing is found', () => {
			const cfg = {
				rules: [
					{
						data: {
							iconUrl: {
								matches: '[alt]',
								selector: 'img',
								value: '@src'
							}
						}
					}
				]
			};
			const log = mountTriggerEvent({...cfg, target: '#aria-button'});
			expect(log.mock.calls[0][0].iconUrl).toBeUndefined();
		});
	});

	describe('#expression', () => {
		test('base case of using expression where data is matched', () => {
			const cfg = {
				rules: [
					{
						data: {
							avatarHost: {
								selector: 'img[role=avatar]',
								value: '@src',
								expression: 'https://(.*)/.*'
							}
						}
					}
				]
			};
			const log = mountTriggerEvent(cfg);
			expect(log.mock.calls[0][0].avatarHost).toBe('via.placeholder.com');
		});
		test('base case of using expression where nothing is matched', () => {
			const cfg = {
				rules: [
					{
						data: {
							avatarHost: {
								selector: 'img[role=avatar]',
								value: 'src',
								expression: 'ftp://(.*)/.*'
							}
						}
					}
				]
			};
			const log = mountTriggerEvent(cfg);
			expect(log.mock.calls[0][0].avatarHost).toBeUndefined();
		});
	});
});
