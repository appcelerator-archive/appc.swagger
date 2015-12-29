var _ = require('lodash'),
	async = require('async'),
	request = require('request');

/**
 * Downloads and parses the Swagger API endpoint specified.
 * @param params
 * @param api
 * @param next
 */
exports.downloadAPI = function downloadAPI(params, api, next) {
	var self = this,
		config = this.config;
	params.logger.trace('Downloading ' + config.swaggerDocs + api.path);

	var schema = params.schema;
	if (!schema) {
		schema = params.schema = {};
	}

	self.hit(config.swaggerDocs + api.path, function (body) {
		var childAPIs = body.apis,
			tasks = [];

		for (var i = 0; i < childAPIs.length; i++) {
			var childAPI = childAPIs[i],
				modelName = self.parseModelName(childAPI.path),
				pathVars = self.parsePathVars(childAPI.path),
				url = body.basePath + childAPI.path,
				operations = childAPI.operations;

			for (var j = 0; j < operations.length; j++) {
				var operation = operations[j],
					methodName = self.parseMethodName(config, operation.method, childAPI.path),
					model = schema[modelName];

				if (!model) {
					model = schema[modelName] = {
						methods: [],
						fields: {}
					};
				}
				var method = {
					// TODO: Need to implement method overriding (aka: same name, different signatures).
					name: methodName,
					params: pathVars,
					verb: operation.method,
					url: url,
					path: childAPI.path,
					operation: operation
				};
				model.methods.push(method);

				if (config.discoverFields && config.canDiscover(method)) {
					tasks.push(self.discoverEndpoint.bind(self, params, config, method, model.fields));
				}
			}
		}

		async.series(tasks, function (err) {
			params.bar && params.bar.tick();
			next.apply(this, arguments);
		});
	});
};
