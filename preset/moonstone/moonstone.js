/**
 * Analytics configuration preset for Moonstone applications
 *
 * @module analytics/preset/moonstone
 * @exports configure
 * @public
 */

import {configure as conf} from '../..';

const config = {
	'selector': '.spottable'
};

/**
 * Configures Moonstone application presets
 *
 * @function
 * @param {Object} [cfg] - Additional configuration options. See {@link analytics.Config}.
 * @memberof analytics/preset/moonstone
 */
const configure = (cfg) => {
	conf({
		...config,
		...cfg
	});
};

export default configure;
export {
	config,
	configure
};
