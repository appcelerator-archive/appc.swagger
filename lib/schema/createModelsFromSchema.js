const Arrow = require('arrow');
const _ = require('lodash');
const createFromSwaggerModel = require('../utility/createFromSwaggerModel');

/**
 * Creates models from your schema (see "fetchSchema" for more information on the schema).
 */
exports.createModelsFromSchema = function () {
	var self = this,
		models = {},
		modelNames = Object.keys(self.schema);

	modelNames.sort();

	modelNames.forEach(function (modelName) {
		var object = self.schema[modelName];
		self.logger.trace(self.name + '/' + modelName);
		models[self.name + '/' + modelName] = createFromSwaggerModel(self, {
			name: modelName,
			model: object
		});
	});

	self.models = _.defaults(self.models || {}, models);
};
