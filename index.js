/* global XMLHttpRequest */

import {on} from '@enact/core/dispatcher';
import {handle, forKey, forEventProp} from '@enact/core/handle';
import {onWindowReady} from '@enact/core/snapshot';
import {coerceArray, Job} from '@enact/core/util';
import xhr from 'xhr';
import warning from 'warning';

// Module state

// When `idle`, accumulates the log events to be processed during the next idle frame or on unload
const logQueue = [];

const config = {
    // Enables metric logging
    enabled: false,

    // An object of filter rules that remove entries from the log. When null, no events are excluded
    // by the filter.
    exclude: null,

    // Optional custom filter function to remove entries from the log
    filter: null,

    // Function accepting the node (as matched by the selector) and the original event and returning
    // a log entry in whichever format the application chooses
    format: null,

    // Defines the amount of time in milliseconds the logger will spend processing events. Only
    // effective when `idle` is true
    frameSize: 100,

    // Process events asynchronous when the system is idle
    idle: true,

    // An object of filter rules that must be met to be included. When null, any event not excluded
    // by `exclude` will be logged.
    include: null,

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

// Resolves the closest ancestor of a node that matches `selector`
const closest = (target) => config.selector && target ? target.closest(config.selector) : target;

// convert an array of strings to a single regex
const buildRuleset = ruleset => Object.keys(ruleset).reduce((result, key) => {
    result[key] = new RegExp(`(${coerceArray(ruleset[key]).map(sanitize).join('|')})`);
    return result;
}, {});

// Determines if the message matches a set of rules
const matchesRules = (ruleset, msg) => Object.keys(ruleset).some(key => {
    return !!msg[key] && ruleset[key].test(msg[key]);
});

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
const resolveLabel = (node) => {
    return node.dataset.metricLabel ||
        node.getAttribute('aria-label') ||
        node.textContent;
};

// Default message formatter
const formatMessage = (node, {type}) => {
    if (node) {
        return {
            time: Date.now(),
            type,
            label: resolveLabel(node)
        };
    }

    return null;
};

// Invokes the config's format function (if it exists) and returns the result
const format = (target, ev) => {
    return config.format && config.format(target, ev) || formatMessage(target, ev);
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
const log = (ev) => logEntry(format(closest(ev.target), ev));

// Registers an event listener using the capture phase. `listener` is optional to filter the event
// before the log processing chain.
const addListener = (event, listener) => {
    const handler = handle(
        isEnabled,
        listener,
        log
    );

    document.addEventListener(event, handler, {capture: true});

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

    if (typeof cfg.enabled === 'boolean') {
        (cfg.enabled ? enable : disable)();
    }

    onWindowReady(() => {
        if (Array.isArray(cfg.listeners)) {
            cfg.listeners.forEach(key => addListener(key));
        } else if (typeof cfg.listeners === 'object') {
            Object.keys(cfg.listeners).forEach(key => addListener(key, cfg.listeners[key]));
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
    addListener('keydown', forKey('enter'));
    addListener('click', isLeftClick);
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
