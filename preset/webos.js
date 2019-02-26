import {fetchAppId} from '@enact/webos/application';
import {info} from '@enact/webos/pmloglib';

import {configure as conf, fetchConfig} from '../index';

const config = {
    enabled: false,
    log: (message) => {
        info('NL_ENACT', message);
    }
};

const configure = (cfg) => {
    conf({
        ...config,
        ...cfg
    });

    let {path} = cfg;
    if (!path) {
        const appId = fetchAppId();

        // if we lack a path and can't parse an app id, we won't be able to
        // retrieve a local config file so bail out
        if (!appId) return;

        path = `/mnt/lg/cmn_data/whitelist/dr/enact/${appId}.json`
    }

    fetchConfig(path, {
        sync: true,
        parse: (body) => {
            const json = JSON.parse(body);
            // if the file is found, treat it as enabled
            json.enabled = true;

            return json;
        }
    });
};

export default configure;
export {
    config,
    configure
};
