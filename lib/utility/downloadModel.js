var _ = require('lodash'),
	async = require('async');

/**
 * Translate from Swagger type to JS type
 * @param {Object} prop
 * @returns {string}
 */
function translateType(prop) {
	var complexType = prop.type,
		typeMap = {
			'array': 'Array',
			'integer': 'Integer',
			'integer.int32': 'Integer',
			'integer.int64': 'Integer',
			'number': 'Number',
			'number.double': 'Number',
			'number.float': 'Number',
			'string': 'String',
			'string.byte': 'String',
			// binary not supported in JavaScript client right now, using String as a workaround
			'string.binary': 'String',
			'boolean': 'Boolean',
			'string.date': 'Date',
			'string.date-time': 'Date',
			'string.password': 'String',
			'file': 'File',
			'object': 'Object'
		};
	if (prop.format) {
		complexType = complexType + '.' + prop.format;
	}
	return typeMap[complexType];
}

/**
 * Downloads and parses the Swagger definition specified.
 * @param {Object} params
 * @param {string} modelName
 * @param {Object} definition http://swagger.io/specification/#definitionsObject
 * @param {Function} next
 */
exports.downloadModel = function (params, modelName, definition, next) {
	var self = this,
		config = this.config,
		schema = params.schema,
		model,
		properties = definition.properties,
		required = definition.required || [];
	params.logger.trace('Downloading ' + modelName);

	if (!schema) {
		schema = params.schema = {};
	}

	modelName = self.parseModelName(modelName);

	model = schema[modelName];
	if (!model) {
		model = schema[modelName] = {
			methods: [],
			fields: {}
		};
	}

	// Grab the fields, translate the type from Swagger type to JS type
	_.forOwn(properties, function (value, key) {
		if ('id' !== key) {  // skip 'id' because Arrow will assume it?
			model.fields[key] = {
				type: translateType(value),
				required: required.indexOf(key) !== -1
			};
		}
	});

	// Mark progress and move on
	params.bar && params.bar.tick();
	next();
};
