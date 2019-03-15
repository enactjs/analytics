import {mountTriggerEvent} from './utils';

describe('configure data', () => {
	// Ensure fresh instance of analytics with untouch default values
	beforeEach(() => jest.resetModules());

	describe('#value', () => {
		test('base case of a simple <text> pseudo-attribute', () => {
			const data = {
				innerText: '<text>'
			};
			const log = mountTriggerEvent({data, target: '#data-button'});
			expect(log.mock.calls[0][0].innerText).toBe('Click Me');
		});
		test('base case of a simple attribute selector', () => {
			const data = {
				altLabel: 'alt'
			};
			const log = mountTriggerEvent({data});
			expect(log.mock.calls[0][0].altLabel).toBe('First Button');
		});
		test('advanced case of a object <text> value', () => {
			const data = {
				sectionTitle: {
					selector: 'header h1',
					value: '<text>'
				}
			};
			const log = mountTriggerEvent({data, selector: 'article'});
			expect(log.mock.calls[0][0].sectionTitle).toBe('Header Text');
		});
		test('advanced case of a object attribute value', () => {
			const data = {
				sectionIndex: {
					closest: 'section',
					value: 'data-section-index'
				}
			};
			const log = mountTriggerEvent({data});
			expect(log.mock.calls[0][0].sectionIndex).toBe('0');
		});
		test('advanced case of a array of resolver strings, returning first match', () => {
			const data = {
				id: ['id', 'data-spotlight-id', 'data-component-id']
			};
			const log = mountTriggerEvent({data});
			expect(log.mock.calls[0][0].id).toBe('test-target');
		});
		test('advanced case of a array of resolver value objects, returning first match', () => {
			const data = {
				sectionIndex: [
					{
						closest: 'p',
						value: 'data-section-index'
					},
					{
						closest: 'section',
						value: 'data-section-index'
					}
				]
			};
			const log = mountTriggerEvent({data});
			expect(log.mock.calls[0][0].sectionIndex).toBe('0');
		});
	});

	describe('#closest', () => {
		test('base case of using closest where data is found', () => {
			const data = {
				sectionIndex: {
					closest: 'section',
					value: 'data-section-index'
				}
			};
			const log = mountTriggerEvent({data});
			expect(log.mock.calls[0][0].sectionIndex).toBe('0');
		});
		test('base case of using closest where nothing is found', () => {
			const data = {
				sectionIndex: {
					closest: 'p',
					value: 'data-section-index'
				}
			};
			const log = mountTriggerEvent({data});
			expect(log.mock.calls[0][0].sectionIndex).toBeUndefined();
		});
	});

	describe('#selector', () => {
		test('base case of using selector where data is found', () => {
			const data = {
				iconUrl: {
					selector: '[role=icon]',
					value: 'src'
				}
			};
			const log = mountTriggerEvent({data});
			expect(log.mock.calls[0][0].iconUrl).toBe('https://via.placeholder.com/50');
		});
		test('base case of using selector where nothing is found', () => {
			const data = {
				iconUrl: {
					selector: '[role=other]',
					value: 'src'
				}
			};
			const log = mountTriggerEvent({data});
			expect(log.mock.calls[0][0].iconUrl).toBeUndefined();
		});
	});

	describe('#matches', () => {
		test('base case of using matches where data is found', () => {
			const data = {
				iconUrl: {
					matches: '[alt]', // matches #test-target, which has alt attribute
					selector: 'img',
					value: 'src'
				}
			};
			const log = mountTriggerEvent({data});
			expect(log.mock.calls[0][0].iconUrl).toBe('https://via.placeholder.com/50');
		});
		test('base case of using matches where nothing is found', () => {
			const data = {
				iconUrl: {
					matches: '[alt]',
					selector: 'img',
					value: 'src'
				}
			};
			const log = mountTriggerEvent({data, target: '#aria-button'});
			expect(log.mock.calls[0][0].iconUrl).toBeUndefined();
		});
	});

	describe('#expression', () => {
		test('base case of using expression where data is matched', () => {
			const data = {
				avatarHost: {
					selector: 'img[role=avatar]',
					value: 'src',
					expression: 'https:\/\/(.*)\/.*'
				}
			};
			const log = mountTriggerEvent({data});
			expect(log.mock.calls[0][0].avatarHost).toBe('via.placeholder.com');
		});
		test('base case of using expression where nothing is matched', () => {
			const data = {
				avatarHost: {
					selector: 'img[role=avatar]',
					value: 'src',
					expression: 'ftp:\/\/(.*)\/.*'
				}
			};
			const log = mountTriggerEvent({data});
			expect(log.mock.calls[0][0].avatarHost).toBeUndefined();
		});
	});
});
