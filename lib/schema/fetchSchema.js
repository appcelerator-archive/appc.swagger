const _ = require('lodash');
var SwaggerClient = require('swagger-client');
const utils = require('../utility/utils');
const schemaUtils = require('../utility/schemaUtils');
const auth = require('../authentication/auth');

/**
 * Fetches the schema for your connector.
 *
 * For example, your schema could look something like this:
 * {
 *     objects: {
 *         person: {
 *             first_name: {
 *                 type: 'string',
 *                 required: true
 *             },
 *             last_name: {
 *                 type: 'string',
 *                 required: false
 *             },
 *             age: {
 *                 type: 'number',
 *                 required: false
 *             }
 *         }
 *     }
 * }
 *
 * @param callback
 * @returns {*}
 */
exports.fetchSchema = function (callback) {
	// Configure our model load.
	const connector = this;
	const logger = connector.logger;
	const options = connector.config;

	loginAndDownload(function (err, swaggerObject) {
		if (err) {
			callback(err);
		} else {
			auth.addSecurityDefinitions(connector, swaggerObject.securityDefinitions);
			callback(null, createSchema(swaggerObject));
		}
	});

	/**
	 * Downloads the Swagger docs.
	 */
	function loginAndDownload(callback) {
		const clientOptions = {
			url: options.swaggerDocs,
			success: success,
			failure: failure,
			authorizations: {}
		};
		var client;

		if (options.login) {
			if (options.login.username) {
				clientOptions.authorizations.Basic = new SwaggerClient.PasswordAuthorization(options.login.username, options.login.password || '');
			}
			if (options.login.apiKey) {
				clientOptions.authorizations.APIKey = new SwaggerClient.ApiKeyAuthorization(options.login.apiKey.name, options.login.apiKey.value, options.login.apiKey.type || 'query');
			}
		}
		logger.trace('Downloading ' + options.swaggerDocs);
		client = new SwaggerClient(clientOptions);

		/**
		 * Called when swagger client successfully grabbed the swagger API docs
		 */
		function success() {
			callback(null, client.swaggerObject);
		}

		/**
		 * Called when swagger client fails to grab the Swagger docs
		 */
		function failure(err) {
			logger.error('Login failed. Please double check your credentials.');
			callback(err);
		}
	}

	/**
	 * Creates a schema from the Swagger model definitions
	 * @param {Object} swaggerObject
	 */
	function createSchema(swaggerObject) {
		var baseURL = (swaggerObject.schemes && swaggerObject.schemes[0]) || 'https';
		baseURL += '://';
		baseURL += swaggerObject.host;

		if (swaggerObject.basePath) {
			baseURL += swaggerObject.basePath;
		}

		//Not too sure about this
		const params = {
			schema : {},
			swaggerObject : swaggerObject,
			baseURL : baseURL
		};

		schemaUtils.processModels(connector, params);

		// Try to find API endpoints that correspond to the models.
		schemaUtils.processAPIs(connector, params);

		return params.schema;
	}
};
