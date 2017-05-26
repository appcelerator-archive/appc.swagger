const _ = require('lodash');
const utils = require('./utils.js');

module.exports = {
	processModels : downloadModels,
	processAPIs : downloadAPIs
};

/**
 * Loops through the models and generates local equivalents
 * @param {Object} connector
 * @param {Object} options
 * @returns {*}
 */
function downloadModels(connector, options) {
	const schema = options.schema;
	const models = options.swaggerObject.definitions;

	for (var modelName in models) {
		var properties = options.swaggerObject.properties;
		var required = options.swaggerObject.required || [];
		connector.logger.trace('Downloading ' + modelName);

		modelName = utils.parseModelName(modelName);

		var model = schema[modelName];
		if (!model) {
			model = {
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

		schema[modelName] = model;
	}
}

/**
 * Parses the Swagger API endpoints specified.
 * @param {Object} connector
 * @param {Object} options
 * @returns {*}
 */
function downloadAPIs(connector, options) {

	const paths = options.swaggerObject.paths;

	for (var path in paths) {
		if (paths.hasOwnProperty(path)) {
			var url = options.baseURL + path;
			var modelName = utils.parseModelName(path);
			connector.logger.trace('Downloading ' + url);

			// Loop through all the methods on the path...
			var globalParams = {};
			var pathObject = paths[path];
			if (pathObject.parameters) {
				globalParams = pathObject.parameters;
			}
			_.forOwn(pathObject, function (op, method) {
				if ('parameters' === method) {
					return;
				}
				(function (next) {
					var methodName = op.operationId || utils.parseMethodName(options, method, path),
						model = _.find(options.schema, function (value, key) {
							return key.toUpperCase() === modelName.toUpperCase();
						});

					if (!model) {
						model = options.schema[modelName] = {
							methods: [],
							fields: {}
						};
					}

					var methodObj = {
						// TODO: Need to implement method overriding (aka: same name, different signatures).
						name: methodName,
						params: translateParameters(_.defaults(op.parameters, globalParams)),
						verb: method.toUpperCase(),
						url: url,
						path: path,
						operation: {
							operationId: op.operationId,
							summary: op.summary,
							description: op.description,
							security: op.security
						}
					};
					model.methods.push(methodObj);
					//next();
				})();
			});
		}
	}
}

/**
 * Hacks the parameters to remove properties injected by swagger-client for model references.
 * Using them causes circular references, which breaks the process later on.
 *
 * @param {Object} params
 * @param {Object} modified params
 */
function translateParameters(params) {
	var newParam = [];
	_.forEach(params, function (param) {
		if (param.schema && param.schema.$ref) {
			var type = param.modelSignature && param.modelSignature.type,
				model = type && param.modelSignature.definitions && param.modelSignature.definitions[type],
				definition = model && model.definition,
				properties = definition && definition.properties,
				required = definition && definition.required || [];

			_.forEach(properties, function (val, key) {
				if ('id' !== key) {
					newParam.push({
						in: param.in,
						name: key,
						type: val.type || 'object',
						description: val.description,
						required: required.indexOf(key) !== -1
					});
				}
			});
		} else {
			newParam.push(param);
			delete param.modelSignature; // This is circular reference to model if the param is a model!
			delete param.responseClassSignature;
			delete param.signature;
			delete param.sampleJSON;
		}
	});

	return newParam;
}

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

