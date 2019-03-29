/**
 * Analytics configuration preset for Moonstone applications
 *
 * @module analytics/preset/moonstone
 * @exports configure
 * @public
 */

import {configure as conf} from '..';

const config = {
	'selector': '.spottable'
};

/**
 * Configures Moonstone application presets
 *
 * @function
 * @param {analytics.Config} [cfg] - Additional configuration options
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
