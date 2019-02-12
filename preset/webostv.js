import {config as moonstone} from './moonstone';
import {config as webos, configure as conf} from './webos';

const config = {
    ...moonstone,
    ...webos
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