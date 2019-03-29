/**
 * Analytics configuration preset for webOS applications
 *
 * @module analytics/preset/webos
 * @exports configure
 * @exports fetchAppConfig
 * @public
 */

import {onWindowReady} from '@enact/core/snapshot';
import {fetchAppId} from '@enact/webos/application';
import {info} from '@enact/webos/pmloglib';

import {configure as conf, fetchConfig} from '../..';

let messageId = 'NL_ENACT';

const config = {
	enabled: false,
	log: ({messageId: logMessageId, ...msg}) => {
		info(logMessageId || messageId, msg, '');
	}
};

/**
 * Fetches configuration information from the application's installation location
 *
 * @function
 * @param {String} path - The path where the application's `[appId].json` file is located
 * @memberof analytics/preset/webos
 */
const fetchAppConfig = path => {
	if (!path) {
		const appId = fetchAppId();

		// if we lack a path and can't parse an app id, we won't be able to
		// retrieve a local config file so bail out
		if (!appId) return;

		path = `/mnt/lg/cmn_data/whitelist/dr/enact/${appId}.json`;
	}

	fetchConfig(path, {
		sync: true,
		parse: (body) => {
			const json = JSON.parse(body);
			if (json.messageId) {
				messageId = json.messageId;
			}

			return json;
		}
	});
};

/**
 * Configures webOS application presets
 *
 * @function
 * @param {Object} [cfg] - Additional configuration options. See {@link analytics.Config}.
 * @memberof analytics/preset/webos
 */
const configure = (cfg = {}) => {
	conf({
		...config,
		...cfg
	});

	onWindowReady(() => fetchAppConfig(cfg.path));
};

export default configure;
export {
	config,
	configure,
	fetchAppConfig
};
