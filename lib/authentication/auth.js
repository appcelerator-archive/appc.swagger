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
	var logger = connector.logger;
	var providerConfig = connector.config.authenticationProvider;
	var availableProviders = [];

	logger.trace('Trying to find authentication providers for method security meta:');
	logger.trace(JSON.stringify(methodSecurityMeta, null, 2));
	_.forEach(methodSecurityMeta, function (securityRequirement) {
		_.forEach(securityRequirement, function (securitySchemeOptions, key) {
			if (!providerConfig[key]) {
				logger.warn('No authentication provider configured for security definition "' + key + '". Methods using this security defintion for authentication will probably fail.');
				return;
			}

			var provider;
			if (providerCache[key]) {
				logger.trace('Using cached authentication provider for "' + key + '"');
				provider = providerCache[key];
			} else {
				logger.debug('Building new authentication provider for "' + key + '"');
				provider = buildAuthenticationProvider(providerConfig[key], securitySchemeOptions, logger);
				if (!provider) {
					logger.warn('No provider found. Please check your configuration and swagger spec.');
					logger.warn('Only "apiKey", "basic" and "oauth2" are allowed authentication flows.');
					return;
				}
				if (_.isFunction(provider.injectLogger)) {
					provider.injectLogger(connector.logger);
				}
				providerCache[key] = provider;
			}
			availableProviders.push(provider);
		});
	});

	if (availableProviders.length === 0) {
		logger.trace('No matching authentication provider configured.');
	}

	return availableProviders;
}

/**
 * Builds a new authentication provider instance using our local provider config
 * and the method security options from swagger
 *
 * @param {Object} providerConfig Our local provider config
 * @param {Array} providerOptions Oauth scopes or empty array for apiKey and basic
 * @return {Object} The constructed authentication provider
 */
function buildAuthenticationProvider(providerConfig, providerOptions, logger) {
	logger.debug('Provider config: ' + JSON.stringify(providerConfig, null, 2));
	logger.debug('Method security options: ' + JSON.stringify(providerOptions, null, 2));

	if (providerConfig.securityDefinition.type === 'apiKey') {
		return new ApiKeyAuthentication(providerConfig.securityDefinition.name, providerConfig.value, providerConfig.securityDefinition.in);
	} else if (providerConfig.securityDefinition.type === 'basic') {
		return new BasicAuthentication(providerConfig.username, providerConfig.password);
	} else if (providerConfig.securityDefinition.type === 'oauth2') {
		return new OauthAuthentication(providerConfig, providerOptions);
	}

	return null;
}

/**
	* Adds security definition to matching authentication provider configs.
	* @param {Object} connector
	* @param {Object} swaggerObject
	*/
function addSecurityDefinitions(connector, securityDefinitions) {
	_.forEach(securityDefinitions, function (securityDefinition, key) {
		if (connector.config.authenticationProvider[key]) {
			connector.logger.trace('Adding security definition to "' + key + '" authentication provider.');
			connector.config.authenticationProvider[key].securityDefinition = securityDefinition;
		}
	});
}

module.exports = {
	resolveAuthenticationProviders: resolveAuthenticationProviders,
	addSecurityDefinitions : addSecurityDefinitions
};
