var APIBuilder = require("apibuilder");

exports.createFromSwaggerModel = createFromSwaggerModel;

function createFromSwaggerModel(data) {
	var params = {
		methods: {},
		fields: data.model.fields,
		handleResponse: data.handleResponse
	};

	for (var key in data.model.methods) {
		if (data.model.methods.hasOwnProperty(key)) {
			var method = data.model.methods[key];
			params.methods[method.name] = {
				json: true,
				verb: method.verb,
				url: method.url,
				meta: {
					nickname: method.operation && method.operation.nickname,
					summary: method.operation && method.operation.summary,
					notes: method.operation && method.operation.notes
				},
				params: method.operation && method.operation.params
			};
		}
	}

	return APIBuilder.Model.extend(data.name, params);

}