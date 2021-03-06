
/* global XMLHttpRequest */
/* eslint-disable no-console */

/**
 * Provides methods to add and remove global event listeners
 *
 * @module analytics
 * @exports configure
 * @exports disable
 * @exports enable
 * @exports fetchConfig
 * @exports log
 * @public
 */

import {on} from '@enact/core/dispatcher';
import {adaptEvent, handle, forKey, forEventProp} from '@enact/core/handle';
import {onWindowReady} from '@enact/core/snapshot';
import {coerceArray, Job} from '@enact/core/util';
import xhr from 'xhr';
import warning from 'warning';

// Module state

// When `idle`, accumulates the log events to be processed during the next idle frame or on unload
const logQueue = [];

/**
 * A string representing an attribute of a DOM node.
 *
 * Allowed Values:
 * * Any attribute name preceded by `'@'` (e.g. `'@aria-label'`)
 * * `'<text>'` for the `textContent` of the node
 * * `'<value>'` for the `value` of the node
 * * `'<count>'` for the number of nodes that match the selector
 *
 * @typedef {String} AttributeName
 * @memberof analytics
 */

/**
 * A string representing a CSS selector
 *
 * @typedef {String} CssSelector
 * @memberof analytics
 */

/**
 * A string representing a regular expression. Should omit leading and trailing `'/'`s.
 *
 * @typedef {String} RegularExpressionString
 * @memberof analytics
 */

/**
 * The string value `'<text>'`
 * @typedef {String} TextContentSelector
 * @memberof analytics
 */

/**
 * A string representing a CSS selector that matches a DOM node by its attribute(s)
 *
 * @typedef {String} AttributeSelector
 * @memberof analytics
 */

/**
 * A string representing a CSS selector that matches an ancestor DOM node
 *
 * @typedef {CssSelector} ClosestSelector
 * @memberof analytics
 */

/**
 * A string representing a regular expression to refine the selection of DOM nodes
 *
 * @typedef {RegularExpressionString} Expression
 * @memberof analytics
 */

/**
 * A string representing a CSS selector that matches a specific DOM node
 *
 * @typedef {CssSelector} Matches
 * @memberof analytics
 */

/**
 * A string representing a CSS selector that matches a descendant DOM node
 *
 * @typedef {CssSelector} Selector
 * @memberof analytics
 */

/**
 * An object that conforms to the Resolution DSL
 *
 * @typedef {Object} Resolver
 * @property {Matches} [matches]
 * @property {ClosestSelector} [closest]
 * @property {Selector} [selector]
 * @property {Resolver|Resolver[]|String|AttributeName} value
 * @property {Expression} [expression]
 * @memberof analytics
 * @public
 */

/**
 * An object mapping a DSL for metadata resolution to metadata keys. Each key is a
 * [Resolver]{@link analytics.Resolver}.
 *
 * ```
 * {
 *     include: {
 *         // mapping of message key to strings of which the message must include all
 *         panel: 'HOME'
 *     },
 *     exclude: {
 *         // mapping of message key to strings of which the message cannot include any
 *         label: ['blue', 'purple']
 *     },
 *     filter: (msg) => {
 *         // custom filter function
 *     },
 *     data: {
 *         panel: {
 *             closest: "article[role='region']",
 *             value: {
 *                 selector: "header h1",
 *                 value: "<text>"
 *             }
 *         },
 *         icon: {
 *             matches: "[role='button']",
 *             selector: "[class *= 'Icon_icon']",
 *             value: [
 *                 '<text>',
 *                 {
 *                     value: "style",
 *                     expression: "url\(.*\/(.*)\)"
 *                 }
 *             ]
 *         }
 *     }
 * }
 * ```
 *
 * @typedef {Object} Entry
 * @property {Object.<String, String[]|String>} [include] An object of filter rules that must be met
 *                                                      to be included. When `null`, any event not
 *                                                      excluded by `exclude` will be logged.
 * @property {Object.<String, String[]|String>} [exclude] An object of filter rules that remove
 *                                                      entries from the log. When `null`, no events
 *                                                      are excluded by the filter.
 * @property {Function} [filter] Optional custom filter function to remove entries from the log
 * @property {Object.<String, Resolver>} data An object mapping data from the DOM into keys in the
 *                                            message payload.
 * @memberof analytics
 * @public
 */

/**
 * @typedef {Object} Listener
 * @property {Function} filter
 * @property {Function} [adapter]
 * @memberof analytics
 * @public
 */

/**
 * The configuration for gathering analytics
 *
 * @typedef {Object} Config
 * @memberof analytics
 * @property {Boolean} [enabled] Enables metric logging.
 * @property {Function} [format] Function accepting the message -- which includes the time, type,
 *                             label, and output of `data` resolvers -- and returning a log entry in
 *                             whichever format the application chooses.
 * @property {Number} [frameSize] Defines the amount of time in milliseconds the logger will spend
 *                              processing events. Only effective when `idle` is true.
 * @property {Boolean} [idle] Process events asynchronously when the system is idle
 * @property {String[]|Object.<String, Listener>} [listeners] Array of events or object mapping events to filter
 *                                               functions.
 * @property {Function} log Required application-defined function to log the events
 * @property {Entry[]} [rules] A set of rules defining the data to be collected.
 * @property {String} [selector] A CSS selector which finds the closest ancestor from the target of an
 *                             event to consider as the source for the purposes of logging
 */

const config = {
	enabled: false,
	format: null,
	frameSize: 100,
	idle: true,
	listeners: null,
	log: null,
	rules: null,
	selector: '[data-metric-label]'
};

// FP utility functions

const isLeftClick = forEventProp('which', 1);

const isEnabled = () => config.enabled === true;

// Source: https://stackoverflow.com/questions/6300183/sanitize-string-of-regex-characters-before-regexp-build
const sanitize = (str) => str.replace(/[#-.]|[[-^]|[?|{}]/g, '\\$&');

// Logging

/**
 * Logs messages currently in the queue. Logging is limited to the `frameSize` unless `all` is true
 *
 * @function
 * @param {Boolean} all - if truthy, flush the log queue
 * @returns undefined
 *
 * @private
 */
const flushLogQueue = (all) => {
	if (config.log) {
		const endBy = all ? 0 : Date.now() + config.frameSize;

		while (logQueue.length && (all || Date.now() < endBy)) {
			config.log(logQueue.shift());
		}
	}
};

const isGlobal = target => target === document || target === document.body;

/**
 * Resolves the closest ancestor of a node that matches `selector`
 *
 * @function
 * @param {Node} target - the descendant node where resolution should begin
 *
 * @returns {Node}
 * @private
 */
const closest = (target) => {
	if (isGlobal(target) || !config.selector || !target) {
		return target;
	}

	return target.closest(config.selector);
};

// convert an array of strings to a single regex
const buildRuleset = ruleset => Object.keys(ruleset).reduce((result, key) => {
	result[key] = new RegExp(`(${coerceArray(ruleset[key]).map(sanitize).join('|')})`, 'i');
	return result;
}, {});

const matchesRule = (rule, value) => value && rule.test(value);

const matchesRules = (ruleset, msg) => {
	const keys = Object.keys(ruleset);
	const count = keys.filter(key => matchesRule(ruleset[key], msg[key])).length;

	switch (count) {
		case 0:
			return 'NONE';
		case keys.length:
			return 'ALL';
		default:
			return 'SOME';
	}
};

// Determines if the message matches a set of rules
const matchesAnyRules = (ruleset, msg) => matchesRules(ruleset, msg) !== 'NONE';

const matchesAllRules = (ruleset, msg) => matchesRules(ruleset, msg) === 'ALL';

const getFirstNode = (nodeOrList) => {
	return nodeOrList instanceof global.HTMLElement ? nodeOrList : nodeOrList[0];
};

const isAttributeString = (value) => {
	return value[0] === '@' || value[0] === '<';
};

const resolveAttribute = (name) => (node) => {
	// normally, if node isn't found, we bail on data resolution. <count> is the exception in which
	// we'll return 0 if the node isn't found and it's the last in the resolution chain.
	if (name === '<count>') {
		return node ? (node.length || 1) : 0;
	}

	if (!node || node.length === 0) return null;

	const first = getFirstNode(node);

	if (name === '<text>') {
		return first.textContent;
	}

	if (name === '<value>') {
		return first.type === 'password' ? null : first.value;
	}

	if (first instanceof global.HTMLElement) {
		return first.getAttribute(name.substr(1));
	}

	return null;
};

/**
 * Returns a function that accepts a value and uses the provided expression to match against that
 * value. If the expression includes a capture group, the first capture group is returned. If not,
 * the matched expression is returned.
 *
 * @function
 * @param {String} expression - the expression the returned function will use to match against the provided value
 * @returns {Function}
 * @private
 */
const resolveExpression = (expression) => {
	if (expression) {
		try {
			// try to create a regular expression from the string.
			const regex = new RegExp(expression);

			return (value) => {
				if (value == null) return null;

				const result = value.match(regex);

				if (result) {
					// if the expression matches, return the first capture, if it exists, or the entire
					// match otherwise
					return result[1] || result[0];
				}

				return null;
			};
		} catch (e) {
			// do nothing
		}
	}

	// if that fails, return an identity function
	return v => v;
};

/**
 * Resolves the target node to either the nearest ancestor or descendant based on the provided
 * selectors. Only one selector is supported per resolver but may be omitted.
 *
 * @function
 * @param {String} closestSelector - the ancestor selector
 * @param {String} selector - the descendant selector. If `closestSelector` is provided, `selector` will be ignored
 * @returns {Function}
 * @private
 */
const resolveNode = (closestSelector, selector) => (node) => {
	if (!node) return null;
	if (closestSelector) {
		return node.closest(closestSelector);
	} else if (selector) {
		return node.querySelectorAll(selector);
	}

	return node;
};

// Returns a resolver function from either an attribute string or resolver object (or an array of
// either)
const buildResolver = (elementConfig) => {
	if (!elementConfig) return null;

	if (Array.isArray(elementConfig)) {
		const resolvers = elementConfig.map(buildResolver).filter(Boolean);
		return (node) => resolvers.reduce((result, fn) => result || fn(node), null);
	}

	if (typeof elementConfig === 'string') {
		return isAttributeString(elementConfig) ? resolveAttribute(elementConfig) : () => elementConfig;
	}

	const {value, expression, matches, closest: closestSelector, selector} = elementConfig;

	// value is required if not a string
	warning(value, 'Data resolvers must either be a string or object including a {value} member');
	if (!value) return null;

	const nodeResolver = resolveNode(closestSelector, selector);
	const valueResolver = buildResolver(value);
	const expressionResolver = resolveExpression(expression);

	return (node) => {
		if (!node || matches && !getFirstNode(node).matches(matches)) return null;

		return expressionResolver(valueResolver(nodeResolver(node)));
	};
};

// Builds a resolver function for each key in `data` with a valid configuration
const buildDataResolver = (data) => {
	if (!data) return null;

	const result = {};
	Object.keys(data).forEach(key => {
		const resolver = buildResolver(data[key]);
		if (resolver) {
			result[key] = resolver;
		}
	});

	return result;
};

// Filters the message based on the `include` and `exclude` rules as well as the optional custom
// filter function.
const filter = (entry, msg) => {
	if (
		(entry.exclude && matchesAnyRules(entry.exclude, msg)) ||
		(entry.include && !matchesAllRules(entry.include, msg))
	) {

		return false;
	}

	return entry.filter ? entry.filter(msg) : true;
};

// Resolves the label for the message
const resolveLabel = buildResolver([
	'@data-metric-label',
	'@aria-label',
	'<text>'
]);

const resolveData = (entry, node) => {
	if (!entry.data) return null;

	const result = {};
	Object.keys(entry.data).forEach(key => {
		const value = entry.data[key](node);
		if (value != null) {
			result[key] = value;
		}
	});

	return result;
};

// Default message formatter
const format = (entry, {target, ...rest}) => {
	if (!target) return null;

	const message = {
		time: Date.now(),
		label: isGlobal(target) ? 'global' : resolveLabel(target),
		...rest,
		...resolveData(entry, target)
	};

	if (config.format) {
		return config.format(message);
	}

	return message;
};

const logJob = new Job(flushLogQueue);

// Pushes an entry onto the queue and schedules it to run on the next idle frame
const idle = (msg) => {
	logQueue.push(msg);
	if (logQueue.length === 1) {
		logJob.idle();
	}
};

const matchEntry = (ev) => {
	if (!config.rules) return format({}, ev);

	return config.rules.reduce((result, entry) => {
		if (result) return result;

		const msg = format(entry, ev);
		if (msg && filter(entry, msg)) {
			return msg;
		}
	}, null);
};

// Logs the formatted message
const logEntry = (msg) => {
	if (!msg) return;
	if (config.idle) {
		idle(msg);
	} else if (config.log) {
		config.log(msg);
	}
};

/**
 * Accepts an event to consider for logging
 *
 * @function
 * @param {Event} ev - the event to log
 * @returns undefined
 *
 * @memberof analytics
 */
const log = (ev) => logEntry(matchEntry({
	...ev,
	target: closest(ev.target)
}));

const defaultAdapter = (ev) => ({target: ev.target, type: ev.type});

const withDefaultAdapter = (adapter) => {
	if (!adapter) return defaultAdapter;

	return (ev) => ({
		...adapter(ev),
		...defaultAdapter(ev)
	});
};

// Registers an event listener using the capture phase. `listener` is optional to filter the event
// before the log processing chain.
const addListener = ({type, filter: listener, adapter}) => {
	const handler = handle(
		isEnabled,
		listener,
		adaptEvent(
			withDefaultAdapter(adapter),
			log
		)
	);

	document.addEventListener(type, handler, {capture: true});

	return handler;
};

/**
 * Disables logging
 *
 * @function
 * @returns undefined
 * @memberof analytics
 */
const disable = () => {
	config.enabled = false;
	if (logQueue.length > 0) {
		logQueue.splice(0);
	}
};

/**
 * Enables Logging
 *
 * @function
 * @returns undefined
 * @memberof analytics
 */
const enable = () => {
	config.enabled = true;
};

const configureEntry = (cfg = {}) => {
	const entry = {};
	if (typeof cfg.data === 'object')      entry.data = buildDataResolver(cfg.data);
	if (typeof cfg.exclude === 'object')   entry.exclude = buildRuleset(cfg.exclude);
	if (typeof cfg.filter === 'function')  entry.filter = cfg.filter;
	if (typeof cfg.include === 'object')   entry.include = buildRuleset(cfg.include);

	return entry;
};

/**
 * Configures the analytics behavior
 *
 * @function
 * @param {Config} cfg - new configuration for analytics
 * @returns undefined
 * @memberof analytics
 */
const configure = (cfg = {}) => {
	if (Array.isArray(cfg.rules))        config.rules = cfg.rules.map(configureEntry);
	if (typeof cfg.format === 'function')  config.format = cfg.format;
	if (typeof cfg.frameSize === 'number') config.frameSize = cfg.frameSize;
	if (typeof cfg.idle === 'boolean')     config.idle = cfg.idle;
	if (typeof cfg.log === 'function')     config.log = cfg.log;
	if (typeof cfg.selector === 'string')  config.selector = cfg.selector;

	if (typeof cfg.enabled === 'boolean') {
		(cfg.enabled ? enable : disable)();
	}

	onWindowReady(() => {
		if (Array.isArray(cfg.listeners)) {
			cfg.listeners.forEach(type => addListener({type}));
		} else if (typeof cfg.listeners === 'object') {
			Object.keys(cfg.listeners).forEach(type => addListener({...cfg.listeners[type], type}));
		}
	});
};

/**
 * Retrieves a JSON-formatted config using XHR. The `options` for `xhr` are supported as well as a
 * `parse` callback that will receive the raw HTTP response body and which must return a valid
 * config object.
 *
 * @function
 * @param {String} url - the URI for the location of the configuration
 * @param {Object} options - options to pass to XHR
 * @returns undefined
 *
 * @memberof analytics
 */
const fetchConfig = (url, options = {}) => {
	if (typeof XMLHttpRequest !== 'undefined') {
		xhr.XMLHttpRequest = XMLHttpRequest || xhr.XMLHttpRequest;
		let req;
		const {parse, ...rest} = options;
		xhr({...rest, url, beforeSend: (r) => (req = r)}, (err, resp, body) => {
			let error = err || resp.statusCode !== 200 && resp.statusCode;
			// false failure from chrome and file:// urls
			if (error && req.status === 0 && req.response.length > 0) {
				body = req.response;
				error = false;
			}

			if (error) {
				console.error('@enact/analytics: Unable to retrieve configuration from', url);
				return;
			}

			try {
				const json = parse ? parse(body) : JSON.parse(body);

				configure(json);
			} catch (ex) {
				console.error('@enact/analytics: Failed to parse configuration from', url);
				console.error(ex);
			}
		});
	} else {
		warning('Not a web browser environment');
	}
};

// Event handlers

onWindowReady(() => {
	addListener({
		type: 'keydown',
		filter: forKey('enter')
	});

	addListener({
		type: 'click',
		filter: isLeftClick
	});

	on('beforeunload', () => flushLogQueue(true), document);
});

export default configure;
export {
	configure,
	disable,
	enable,
	fetchConfig,
	log
};
