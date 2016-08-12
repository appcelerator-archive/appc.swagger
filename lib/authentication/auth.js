var _ = require('lodash');
var ApiKeyAuthentication = require('./providers/api-key');
var BasicAuthentication = require('./providers/basic');
var OauthAuthentication = require('./providers/oauth');
var providerCache = {};

/**
 * Resolves an authentication provider for the given method seceurity metadata
 *
 * @param {Object} connector Connector instance with authentication prodivder config
 * @param {Object} methodSecurityMeta Security metadata defined in swagger
 * @return {Object} An authentication provider or null if none found
 */
function resolveAuthenticationProviders(connector, methodSecurityMeta) {
	var providerConfig = connector.config.authenticationProvider;
	var availableProviders = [];

	_.forEach(methodSecurityMeta, function (securityRequirement) {
		_.forEach(securityRequirement, function (securitySchemeOptions, key) {
			if (!providerConfig[key]) {
				connector.logger.warn('No authentication provider configured for security definition "' + key + '". Methods using this security defintion for authentication will probably fail.');
				return;
			}

			var provider;
			if (providerCache[key]) {
				connector.logger.debug('Using cached authentication provider for "' + key + '"');
				provider = providerCache[key];
			} else {
				connector.logger.debug('Building new authentication provider for "' + key + '"');
				connector.logger.debug('Provider config: ' + JSON.stringify(providerConfig[key], null, 2));
				connector.logger.debug('Method security options: ' + JSON.stringify(securitySchemeOptions, null, 2));
				provider = buildAuthenticationProvider(providerConfig[key], securitySchemeOptions);
				if (_.isFunction(provider.injectLogger)) {
					provider.injectLogger(connector.logger);
				}
				providerCache[key] = provider;
			}
			availableProviders.push(provider);
		});
	});

	if (availableProviders.length === 0) {
		connector.logger.trace('No matching authentication provider configured.');
		connector.logger.trace('method security meta: ' + JSON.stringify(methodSecurityMeta));
	}

	return availableProviders;
}

/**
 * Builds a new authentication provider instance using our local provider config
 * and the method security options from swagger
 *
 * @param {Object} providerConfig Our local provider config
 * @param {Array} providerOptions Oauth scopes or empty array for apiKey and basic
 * @return {Object}
 */
function buildAuthenticationProvider(providerConfig, providerOptions) {
	if (providerConfig.securityDefinition.type === 'apiKey') {
		return new ApiKeyAuthentication(providerConfig.securityDefinition.name, providerConfig.value, providerConfig.securityDefinition.in);
	} else if (providerConfig.securityDefinition.type === 'basic') {
		return new BasicAuthentication(providerConfig.username, providerConfig.password);
	} else if (providerConfig.securityDefinition.type === 'oauth2') {
		return new OauthAuthentication(providerConfig, providerOptions);
	}
}

module.exports = {
	resolveAuthenticationProviders: resolveAuthenticationProviders
};
