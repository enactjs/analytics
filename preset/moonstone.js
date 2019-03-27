import {configure as conf} from '..';

const config = {
	'selector': '.spottable'
};

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
