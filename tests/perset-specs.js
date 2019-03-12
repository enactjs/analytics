
// TODO: mock out XHR library for webos preset file loading

describe('preset', () => {
	describe('#moonstone', () => {
		test.todo('validate `.spottable` selector is passed to `configure`');
		test.todo('validate spottable elements trigger logging');
	});

	describe('#ilib', () => {
		test.todo('validate ilib localized data strings are de-translated');
	});

	describe('#webos', () => {
		test.todo('validate `webos` preset disables logging by default');
		test.todo('validate `webos` preset uses pmloglib info-level for logging');
		test.todo('validate no app config file is read on non-webOS systems');
		test.todo('validate no app config file is read when appId cannot be determined');
		test.todo('validate /mnt/lg/cmn_data/whitelist/dr/enact/${appId}.json is source for config data');
		test.todo('validate `NL_ENACT` id can be changed via messageId within the config file');
	});

	describe('#webostv', () => {
		test.todo('validate `webostv` preset is just a combination of `moonstone`, `ilib`, and `webos` presets');
	});
});
