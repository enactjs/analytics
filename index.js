/* global XMLHttpRequest */
/* eslint no-console: "off" */

import {on} from '@enact/core/dispatcher';
import {adaptEvent, handle, forKey, forEventProp} from '@enact/core/handle';
import {onWindowReady} from '@enact/core/snapshot';
import {coerceArray, Job} from '@enact/core/util';
import xhr from 'xhr';
import warning from 'warning';

// Module state

// When `idle`, accumulates the log events to be processed during the next idle frame or on unload
const logQueue = [];

const config = {
	// An object mapping a DSL for metadata resolution to metadata keys.
	//
	// Resolution DSL:
	//
	//     CssSelector = String
	//     AttributeName = String
	//     RegularExpressionString = String
	//     TextContentSelector = '<text>'
	//     ValueContentSelector = '<value>'
	//     CountContentSelector = '<count>'
	//
	//     AttributeSelector = AttributeName |
	//                         TextContentSelector |
	//                         ValueContentSelector |
	//                         CountContentSelector
	//     ClosestSelector = CssSelector
	//     Selector = CssSelector
	//     Matches = CssSelector
	//     Expression = RegularExpressionString
	//
	//     Resolver = AttributeSelector | {
	//         matches?: Matches,
	//         closest?: ClosestSelector | selector?: Selector,
	//         value: Resolver | Resolver[],
	//         expression?: Expression
	//     }
	//
	// ```
	// data: {
	//     panel: {
	//         closest: "article[role='region']",
	//         value: {
	//             selector: "header h1",
	//             value: "<text>"
	//         }
	//     },
	//     icon: {
	//         matches: "[role='button']",
	//         selector: "[class *= 'Icon_icon']",
	//         value: [
	//             '<text>',
	//             {
	//                 value: "style",
	//                 expression: "url\(.*\/(.*)\)"
	//             }
	//         ]
	//     }
	// }
	// ```
	data: null,

	// Enables metric logging
	enabled: false,

	// An object of filter rules that remove entries from the log. When null, no events are excluded
	// by the filter.
	exclude: null,

	// Optional custom filter function to remove entries from the log
	filter: null,

	// Function accepting the message -- which includes the time, type, label, and output of `data`
	// resolvers -- and returning a log entry in whichever format the application chooses.
	format: null,

	// Defines the amount of time in milliseconds the logger will spend processing events. Only
	// effective when `idle` is true
	frameSize: 100,

	// Process events asynchronous when the system is idle
	idle: true,

	// An object of filter rules that must be met to be included. When null, any event not excluded
	// by `exclude` will be logged.
	include: null,

	// Array of events or object mapping events to filter functions
	// listeners: ['focus', 'load']
	// listeners: {
	//     focus: (ev) => ev.nodeName === 'button' // only report on focus events for buttons
	// }
	listeners: null,

	// Required application-defined function to log the events
	log: null,

	// A CSS selector which finds the closest ancestor from the target of an event to consider as
	// the source for the purposes of logging
	selector: '[data-metric-label]'
};

// FP utility functions

const isLeftClick = forEventProp('which', 1);

const isEnabled = () => config.enabled === true;

// Source: https://stackoverflow.com/questions/6300183/sanitize-string-of-regex-characters-before-regexp-build
const sanitize = (str) => str.replace(/[#-.]|[[-^]|[?|{}]/g, '\\$&');

// Logging

// Logs messages currently in the queue. Logging is limited to the `frameSize` unless `all` is true
const flushLogQueue = (all) => {
	if (config.log) {
		const endBy = all ? 0 : Date.now() + config.frameSize;

		while (logQueue.length && (all || Date.now() < endBy)) {
			config.log(logQueue.shift());
		}
	}
};

const isGlobal = target => target === document || target === document.body;

// Resolves the closest ancestor of a node that matches `selector`
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

// Determines if the message matches a set of rules
const matchesRules = (ruleset, msg) => Object.keys(ruleset).some(key => {
	return !!msg[key] && ruleset[key].test(msg[key]);
});

const getFirstNode = (nodeOrList) => {
	return nodeOrList instanceof global.HTMLElement ? nodeOrList : nodeOrList[0];
};

const resolveAttribute = (name) => (node) => {
	if (!node || node.length === 0) return null;

	if (name === '<count>') {
		return node.length || 1;
	}

	const first = getFirstNode(node);

	if (name === '<text>') {
		return first.textContent;
	}

	if (name === '<value>') {
		return first.type === 'password' ? null : first.value;
	}

	return first.getAttribute(name);
};

// Returns a function that accepts a value and uses the provided expression to match against that
// value. If the expression includes a capture group, the first capture group is returned. If not,
// the matched expression is returned.
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

// Resolves the target node to either the nearest ancestor or descendant based on the provided
// selectors. Only one selector is supported per resolver but may be omitted.
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
		return resolveAttribute(elementConfig);
	}

	const {value, expression, matches, closest: closestSelector, selector} = elementConfig;

	// value is required if not a string
	warning(value, 'Data resolvers must either be a string or object including a {value} member');
	if (!value) return null;

	const nodeResolver = resolveNode(closestSelector, selector);
	const valueResolver = buildResolver(value);
	const expressionResolver = resolveExpression(expression);

	return (node) => {
		if (matches && !getFirstNode(node).matches(matches)) return null;

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
const filter = (msg) => {
	if (
		(config.exclude && matchesRules(config.exclude, msg)) ||
		(config.include && !matchesRules(config.include, msg))
	) {
		return false;
	}

	return config.filter ? config.filter(msg) : true;
};

// Resolves the label for the message
const resolveLabel = buildResolver([
	'data-metric-label',
	'aria-label',
	'<text>'
]);

const resolveData = (node) => {
	if (!config.data) return null;

	const result = {};
	Object.keys(config.data).forEach(key => {
		const value = config.data[key](node);
		if (value) {
			result[key] = value;
		}
	});

	return result;
};

// Default message formatter
const format = ({target, ...rest}) => {
	if (!target) return null;

	const message = {
		time: Date.now(),
		label: isGlobal(target) ? 'global' : resolveLabel(target),
		...rest,
		...resolveData(target)
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

// Logs the formatted message
const logEntry = (msg) => {
	if (!msg || !filter(msg)) return;
	if (config.idle) {
		idle(msg);
	} else if (config.log) {
		config.log(msg);
	}
};

// Accepts an event to consider for logging
const log = (ev) => logEntry(format({
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

// Disables logging
const disable = () => {
	config.enabled = false;
	if (logQueue.length > 0) {
		logQueue.splice(0);
	}
};

// Enables Logging
const enable = () => {
	config.enabled = true;
};

// Configures the logging behavior
const configure = (cfg = {}) => {
	if (typeof cfg.exclude === 'object')   config.exclude = buildRuleset(cfg.exclude);
	if (typeof cfg.filter === 'function')  config.filter = cfg.filter;
	if (typeof cfg.format === 'function')  config.format = cfg.format;
	if (typeof cfg.frameSize === 'number') config.frameSize = cfg.frameSize;
	if (typeof cfg.idle === 'boolean')     config.idle = cfg.idle;
	if (typeof cfg.include === 'object')   config.include = buildRuleset(cfg.include);
	if (typeof cfg.log === 'function')     config.log = cfg.log;
	if (typeof cfg.selector === 'string')  config.selector = cfg.selector;
	if (typeof cfg.data === 'object')      config.data = buildDataResolver(cfg.data);

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

// Retrieves a JSON-formatted config using XHR. The `options` for `xhr` are supported as well as a
// `parse` callback that will receive the raw HTTP response body and which must return a valid
// config object.
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
