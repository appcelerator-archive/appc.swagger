var _ = require('lodash'),
	async = require('async');

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
 * Downloads and parses the Swagger API endpoint specified.
 * @param {Object} params
 * @param {string} path The relative path of the API endpoint
 * @param {Object} pathObject
 * @param {Function} next
 */
exports.downloadAPI = function downloadAPI(params, path, pathObject, next) {
	var self = this,
		config = this.config,
		url = params.baseURL + path,
		modelName = self.parseModelName(path), // FIXME The model name may not be in the path, we should look at params to tell
		tasks = [];
	params.logger.trace('Downloading ' + url);

	var schema = params.schema;
	if (!schema) {
		schema = params.schema = {};
	}

	// Loop through all the methods on the path...
	var globalParams = {};
	if (pathObject.parameters) {
		globalParams = pathObject.parameters;
	}
	_.forOwn(pathObject, function (op, method) {
		if ('parameters' === method) {
			return;
		}
		tasks.push(function (next) {
			var methodName = op.operationId || self.parseMethodName(config, method, path),
				model = _.find(schema, function (value, key) {
					return key.toUpperCase() === modelName.toUpperCase();
				});

			if (!model) {
				model = schema[modelName] = {
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
					description: op.description
				}
			};
			model.methods.push(methodObj);
			next();
		});
	});

	async.series(tasks, function (err) {
		params.bar && params.bar.tick();
		next.apply(this, arguments);
	});
};
