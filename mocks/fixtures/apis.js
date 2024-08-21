const integrationTestApis = require('./integration-test-apis');
const integrationConfigurations = require('./integration-configuration');

module.exports = [...integrationTestApis, ...integrationConfigurations];
