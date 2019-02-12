import {configure as conf} from '../index';

const config = {
    "selector": ".spottable"
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
