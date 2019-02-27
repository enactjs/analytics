import ResBundle from '@enact/i18n/ilib/lib/ResBundle';

import {configure as conf} from '../index';

const config = {
    format: (msg) => {
        // Retrieve the ResBundle to get access to the string map for the current locale.
		const resBundle = new ResBundle();
        const map = resBundle.getResObj();

        // For every key (except type and time), attempt to delocalize the string.
		Object.keys(msg).filter(key => key !== 'type' && key !== 'time').forEach(msgKey => {
            // We have to convert the case since the text may be converted by UI components to a
            // different case during render.
			const upperValue = msg[msgKey].toUpperCase();
			const value = Object.keys(map).find(key => upperValue === map[key].toUpperCase());

			if (value) {
				msg[msgKey] = value;
			}
		});

		return msg;
	}
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