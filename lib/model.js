var APIBuilder = require("apibuilder");

exports.createFromSwaggerModel = createFromSwaggerModel;

function createFromSwaggerModel(data) {
	var params = {
		methods: {},
		fields: data.model.fields,
		handleResponse: data.handleResponse
	};

	data.model.methods.forEach(function(method) {
		params.methods[method.name] = {
			json: true,
			verb: method.verb,
			url: method.url,
			meta: {
				nickname: method.operation.nickname,
				summary: method.operation.summary,
				notes: method.operation.notes
			},
			params: method.operation.params
		};
	});

	return APIBuilder.createModel(data.name, params);

}