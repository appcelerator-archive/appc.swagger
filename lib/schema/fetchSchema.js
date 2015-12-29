var _ = require('lodash'),
	async = require('async'),
	request = require('request');

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
		tasks = [];

	// Did they tell us how to login to the API? Great! Do so.
	if (options.login && options.canDiscover && options.discoverFields) {
		if (_.isFunction(options.login)) {
			tasks.push(options.login.bind(self, params));
		} else {
			tasks.push(self.wrappedLogin.bind(self, params));
		}
	} else {
		params.logger.debug('Endpoint discovery has not been configured, so it is being skipped.');
	}

	// Proceed by downloading the main api documentation, and then download and process each sub document.
	tasks.push(function (next) {
		params.logger.trace('Downloading ' + options.swaggerDocs);
		self.hit(options.swaggerDocs, function (body) {
			async.each(body.apis, self.downloadAPI.bind(self, params), next);
		});
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
