import {forKey} from '@enact/core/handle';

import {config as moonstone} from './moonstone';
import {config as ilib} from './ilib';
import {config as webos, configure as conf} from './webos';

const adapter = (keyName) => keyName ? {keyName} : null;

const keys = ['red', 'blue', 'green', 'yellow', 'cancel'];

const config = {
    ...moonstone,
    ...ilib,
    ...webos,
    listeners: {
        keydown: {
            filter: (ev) => keys.find(n => forKey(n, ev)),
            adapter: (ev) => adapter(keys.find(n => forKey(n, ev)))
        }
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
