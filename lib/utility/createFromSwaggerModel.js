var Arrow = require('arrow');

exports.createFromSwaggerModel = function createFromSwaggerModel(data) {
	var params = {
		methods: {},
		actions: [],
		fields: data.model.fields,
		handleResponse: data.handleResponse,
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
					nickname: method.operation && method.operation.nickname,
					summary: method.operation && method.operation.summary,
					notes: method.operation && method.operation.notes
				},
				params: method.operation && (method.operation.params || method.operation.parameters)
			};
		}
	}
	this.logger.trace(Object.keys(params.methods));

	var Model = Arrow.Model.extend(data.name, params);
	this.bindModelMethods(Model);
	return Model;
};
