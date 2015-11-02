var Arrow = require('arrow'),
	_ = require('lodash');

/**
 * Creates models from your schema (see "fetchSchema" for more information on the schema).
 */
exports.createModelsFromSchema = function () {
	var self = this,
		models = {};

	Object.keys(self.metadata.schema).forEach(function (modelName) {
		var object = self.metadata.schema[modelName];
		self.logger.trace(self.name + '/' + modelName);
		models[self.name + '/' + modelName] = self.createFromSwaggerModel({
			name: modelName,
			model: object,
			connector: self,
			handleResponse: self.config.handleResponse
		});
	});

	self.models = _.defaults(self.models || {}, models);
};
