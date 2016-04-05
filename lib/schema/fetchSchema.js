var _ = require('lodash'),
	async = require('async'),
	SwaggerClient = require('swagger-client');

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
	var self = this,
		logger = this.logger,
		options = this.config,
		params = {
			schema: {},
			logger: logger || require('arrow').createLogger({}, {
				name: 'appc.swagger', useConsole: true, level: 'debug'
			}),
			options: options
		},
		tasks = [],
		clientOptions = {
			url: options.swaggerDocs
		};

	// Did they tell us how to login to the API? Great! Do so.
	if (options.login && options.canDiscover) {
		clientOptions.authorizations = {};
		if (options.login.username) {
			clientOptions.authorizations.Basic = new SwaggerClient.PasswordAuthorization(options.login.username, options.login.password || '');
		}
		if (options.login.apiKey) {
			clientOptions.authorizations.APIKey = new SwaggerClient.ApiKeyAuthorization(options.login.apiKey.name, options.login.apiKey.value, options.login.apiKey.type || 'query');
		}
	} else {
		params.logger.debug('Endpoint discovery has not been configured, so it is being skipped.');
	}

	// Download the swagger docs!
	tasks.push(function (next) {
		var client;
		params.logger.trace('Downloading ' + options.swaggerDocs);

		/**
		 * Called when swagger client successfully grabbed the swagger API docs
		 */
		clientOptions.success = function () {
			params.swaggerObject = client.swaggerObject;
			next();
		};
		/**
		 * Called when swagger client fails to grab the Swagger docs
		 */
		clientOptions.failure = function (err) {
			params.logger.error('Login failed. Please double check your credentials.');
			next(err);
		};
		client = new SwaggerClient(clientOptions);
	});

	// Translate the models
	tasks.push(function (next) {
		var baseURL = (params.swaggerObject.schemes && params.swaggerObject.schemes[0]) || 'https';
		baseURL += '://';
		baseURL += params.swaggerObject.host;

		if (params.swaggerObject.basePath) {
			baseURL += params.swaggerObject.basePath;
		}
		params.baseURL = baseURL;

		// loop through the models and generate local equivalents
		var models = params.swaggerObject.definitions;
		for (var modelName in models) {
			if (models.hasOwnProperty(modelName)) {
				// TODO do this async!
				self.downloadModel(params, modelName, models[modelName], function (err) {
					if (err) {
						return next(err);
					}
				});
			}
		}

		// Try to find API endpoints that correspond to the models.
		var paths = params.swaggerObject.paths;
		for (var path in paths) {
			if (paths.hasOwnProperty(path)) {
				// TODO do this async!
				self.downloadAPI(params, path, paths[path], function (err) {
					if (err) {
						return next(err);
					}
				});
			}
		}
		next();
	});

	// That's it! After all of the tasks execute, exec our callback.
	return async.series(tasks, function (err) {
		if (err) {
			callback(err);
		} else {
			callback(null, params.schema);
		}
	});
};
