var _ = require('lodash'),
	request = require('request'),
	Arrow = require('arrow');

/**
 * Executes a method, hitting the Swagger defined API with the provided (optional) arguments, then executing the callback.
 */
exports.execute = function execute() {
	var data = arguments[0],
		context = this,
		connector = this.connector,
		callback = arguments[arguments.length - 1],
		method = this.method,
		Model = this.model,
		options = {
			jar: connector.config.jar || (connector.config.jar = request.jar()),
			method: method.verb,
			uri: method.url,
			json: method.json
		};

	if (!_.isFunction(callback)) {
		throw new TypeError('The last argument to ' + this.methodName + ' must be a callback function.');
	}

	// Did we receive arguments?
	if (arguments.length > 1) {
		// Does our URL contain variables?
		if (options.uri.indexOf('{') >= 0) {
			var urlParams = options.uri.match(/\{[^}]+\}/g).map(function (v) {
				return v.slice(1, -1);
			});
			if (_.isString(data)) {
				var id = data;
				data = {};
				data[urlParams[0]] = id;
			}
			options.uri = _.template(options.uri.replace(/\{/g, '${'))(data);
			data = _.omit(data, urlParams);
		}
		// Are we sending a body?
		if (method.verb === 'PUT' || method.verb === 'POST' || method.verb === 'PATCH') {
			options.body = data;
		} else {
			// Are we sending query string params?
			for (var key in data) {
				if (data.hasOwnProperty(key)) {
					options.uri += options.uri.indexOf('?') >= 0 ? '&' : '?';
					options.uri += key + '=' + encodeURIComponent(data[key]);
				}
			}
		}
	}

	request(options, function (err, response, body) {
		context.handleResponse(err, body, function (err, result) {

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
				instance.setPrimaryKey(context.getPrimaryKey(result));
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
};
