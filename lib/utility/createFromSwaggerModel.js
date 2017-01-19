var Arrow = require('arrow');
const bindModelMethods = require('./bindModelMethods');

/**
 * Creates an Arrow model based on the provided Swagger model definition.
 * @param connector
 * @param options
 * @returns {*}
 */
module.exports = function (connector, options) {
	var params = {
		methods: {},
		actions: [],
		fields: options.model.fields,
		handleResponse: connector.config.handleResponse,
		connector: connector
	};

	for (var key in options.model.methods) {
		if (options.model.methods.hasOwnProperty(key)) {
			var method = options.model.methods[key];
			params.actions.push(method.name);
			params.methods[method.name] = {
				json: true,
				verb: method.verb,
				url: method.url,
				path: method.path,
				autogen: !!connector.config.modelAutogen,
				meta: {
					nickname: method.operation && method.operation.operationId,
					summary: method.operation && method.operation.summary,
					notes: method.operation && method.operation.description,
					security: method.operation && method.operation.security
				},
				params: method.params || (method.operation && method.operation.parameters)
			};
			connector.logger.trace(' - ' + method.name);
		}
	}

	var Model = Arrow.Model.extend(params.connector.name + '/' + options.name, params);
	bindModelMethods(params.connector, Model);
	return Model;
};
