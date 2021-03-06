/**
 * Analytics configuration preset for applications using `@enact/i18n`
 *
 * @module analytics/preset/ilib
 * @exports configure
 * @public
 */

import {memoize} from '@enact/core/util';
import ilib from '@enact/i18n';
import ResBundle from 'ilib/lib/ResBundle';

import {configure as conf} from '../..';

const memoMapper = memoize((/* locale */) => {
	// Retrieve the ResBundle to get access to the string map for the current locale.
	const resBundle = new ResBundle();
	const map = resBundle.getResObj();

	// We have to convert the case since the text may be converted by UI components to a
	// different case during render.
	const reversed = Object.keys(map).reduce((acc, key) => {
		acc[map[key].toUpperCase()] = key;
		return acc;
	}, {});

	return (value) => reversed[value.toUpperCase()];
});

const getMapper = () => memoMapper(ilib.getLocale());

const config = {
	format: (msg) => {
		const findValue = getMapper();

		// For every string value (except type), attempt to delocalize the string.
		Object.keys(msg)
			.filter(key => key !== 'type' && typeof msg[key] === 'string')
			.forEach(msgKey => {
				const value = findValue(msg[msgKey]);

				if (value) {
					msg[msgKey] = value;
				}
			});

		return msg;
	}
};

/**
 * Configures `@enact/i18n` application presets
 *
 * @function
 * @param {Object} [cfg] - Additional configuration options. See {@link analytics.Config}.
 * @memberof analytics/preset/ilib
 */
const configure = (cfg) => {
	conf({
		...cfg,
		format: (msg) => {
			if (cfg && cfg.format) {
				msg = cfg.format(msg);
			}

			return config.format(msg);
		}
	});
};

export default configure;
export {
	config,
	configure
};
