import {configure as conf} from '../analytics';

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