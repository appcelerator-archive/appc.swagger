var Arrow = require('arrow');
const bindModelMethods = require('./bindModelMethods');

/**
 * Creates an Arrow model based on the provided Swagger model definition.
 * @param data
 * @returns {*}
 */
module.exports = function (data) {
	var params = {
		methods: {},
		actions: [],
		fields: data.model.fields,
		handleResponse: data.connector.config.handleResponse,
		connector: data.connector
	};

	for (var key in data.model.methods) {
		if (data.model.methods.hasOwnProperty(key)) {
			var method = data.model.methods[key];
			params.actions.push(method.name);
			params.methods[method.name] = {
				json: true,
				verb: method.verb,
				url: method.url,
				path: method.path,
				autogen: !!data.connector.config.modelAutogen,
				meta: {
					nickname: method.operation && method.operation.operationId,
					summary: method.operation && method.operation.summary,
					notes: method.operation && method.operation.description,
					security: method.operation && method.operation.security
				},
				params: method.params || (method.operation && method.operation.parameters)
			};
			params.connector.logger.trace(' - ' + method.name);
		}
	}

	var Model = Arrow.Model.extend(params.connector.name + '/' + data.name, params);
	bindModelMethods(params.connector, Model);
	return Model;
};
