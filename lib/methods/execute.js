var _ = require('lodash'),
	request = require('superagent'),
	Arrow = require('arrow'),
	async = require('async'),
	auth = require('../authentication/auth'),
	OauthAuthentication = require('../authentication/providers/oauth');

/**
 * Executes a method, hitting the Swagger defined API with the provided
 * (optional) arguments, then executing the callback.
 */
exports.execute = function execute() {
	var data = arguments[0],
		context = this,
		connector = this.connector,
		callback = arguments[arguments.length - 1],
		method = this.method,
		options = {
			method: method.verb,
			uri: method.url,
			json: method.json
		};

	if (!_.isFunction(callback)) {
		throw new TypeError('The last argument to ' + this.methodName + ' must be a callback function.');
	}

	if (arguments.length > 1) {
		parseArguments(options, data);
	}

	var r = createRequest(options);
	var authenticationProviders = [];
	if (method.meta.security) {
		connector.logger.trace('Method requires authentication, resolving authentication provider...');
		authenticationProviders = auth.resolveAuthenticationProviders(connector, method.meta.security);
	}
	async.each(authenticationProviders, function (provider, callback) {
		provider.apply(r, callback);
	}, function (err) {
		if (err) {
			connector.logger.debug('Applying authentication info to the request failed.');
			connector.logger.debug('The error was: ' + err.message);

			return callback(err);
		}

		sendRequest.call(context, r, function(err, res) {
			if (err === null) {
				return callback(err, res);
			}

			if (err.response && err.response.statusCode === 401) {
				// If we get an unauthorized error and have an oauth provider configured
				// we need to reset its token so it will fetch ne ones on the next request.
				// @TODO: Some kind of retry machanism for oauth providers
				_.forEach(authenticationProviders, function(provider) {
					if (provider instanceof OauthAuthentication) {
						provider.clearToken();
					}
				});
			}

			callback(err, res);
		});
	});
};

/**
 * Parses available arguments and sets them on the options object
 *
 * @param {Object} options
 * @param {Object} data
 */
function parseArguments(options, data) {
	// Does our URL contain variables?
	if (options.uri.indexOf('{') >= 0) {
		var urlParams = options.uri.match(/\{[^}]+\}/g).map(function (v) {
			return v.slice(1, -1);
		});
		if (_.isString(data) || _.isNumber(data)) {
			var id = data;
			data = {};
			data[urlParams[0]] = id;
		} else if (_.isArray(data)) { // asumes that the array of values is in the same order as path vars
			var ids = data;
			data = {};
			_.forEach(ids, function (value, index) {
				data[urlParams[index]] = value;
			});
		}
		options.uri = _.template(options.uri.replace(/\{/g, '${'))(data);
		data = _.omit(data, urlParams);
	}
	// Are we sending a body?
	if (options.method === 'PUT' || options.method === 'POST' || options.method === 'PATCH') {
		options.body = data;
	} else {
		// Are we sending query string params?
		// TODO if there's only one param, allow for string/Number/array first arg, like we do for path vars above
		for (var key in data) {
			if (data.hasOwnProperty(key)) {
				options.uri += options.uri.indexOf('?') >= 0 ? '&' : '?';
				options.uri += key + '=' + encodeURIComponent(data[key]);
			}
		}
	}
}

/**
 * Creates a new superagent request
 *
 * @param {Object} options Options for the new request
 * @return {Request} The created superagent request
 */
function createRequest(options) {
	var methodName = options.method.toLowerCase();
	if (!_.isFunction(request[methodName])) {
		throw new Error('HTTP method ' + options.method + ' is not supported by superagent.');
	}

	var r = request[methodName](options.uri);

	if (options.body) {
		r.send(options.body);
	}

	return r;
}

/**
 * Sends the prepared request and then convertes the response to its
 * model representation
 *
 * Calls handleResponse method defined in the config on the response first to
 * allow a user to apply any required response transformation before we try to
 * create model instances.
 *
 * @param {Request} request Prepared superagent request
 * @param {Function} callback Callback function
 */
function sendRequest(request, callback) {
	var that = this;
	var Model = this.model;
	request.end(function (err, res) {
		that.handleResponse(err, res, res.body, function (err, result) {

			/**
			 * Turns the provided object in to a model instance.
			 * @param result
			 */
			function createInstance(result) {
				if (Model._hasOwnFields === false || Object.keys(Model.fields).length === 0) {
					Model._hasOwnFields = false;
					Model.fields = {};
					for (var key in result) {
						if (result.hasOwnProperty(key)) {
							Model.fields[key] = {type: typeof result[key]};
						}
					}
				}
				var instance = Model.instance(result, true);
				instance.setPrimaryKey(that.getPrimaryKey(result));
				return instance;
			}

			if (err) {
				callback(err);
			} else {
				if (_.isArray(result)) {
					var array = result.map(createInstance);
					result = new Arrow.Collection(Model, array);
				} else {
					result = createInstance(result);
				}
				callback(null, result);
			}
		});
	});
}
