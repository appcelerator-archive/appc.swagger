var _ = require('lodash'),
	async = require('async'),
	request = require('request');

var utils = require('./utils'),
	model = require('./model');

var APIBuilder = require('apibuilder'),
	Logger = APIBuilder.createLogger({}, { name: 'appc.swagger', useConsole: true, level: 'debug' });

/*
 Public API.
 */
exports.loadModels = loadModels;
exports.bindModels = downloaded;

/**
 * Loads models from a Swagger API based on the specified options.
 * @param connector
 * @param options
 * @param logger
 * @param callback
 * @returns {*}
 */
function loadModels(connector, options, logger, callback) {
	// Configure our model load.
	var params = {
			connector: connector,
			models: {},
			logger: logger || Logger,
			options: options
		},
		tasks = [];

	if (!options.swaggerDocs) {
		throw new Error('swaggerDocs is a required parameter. Please configure it.');
	}

	// Did they tell us how to login to the API? Great! Do so.
	if (options.login && options.canDiscover && options.discoverFields) {
		if (_.isFunction(options.login)) {
			tasks.push(options.login.bind(undefined, params));
		}
		else {
			tasks.push(wrappedLogin.bind(undefined, params));
		}
	}
	else {
		params.logger.debug('Endpoint discovery is not fully configured, so it is being skipped.');
	}

	// Proceed by downloading the main api documentation, and then download and process each sub document.
	tasks.push(function downloadMainAPIDoc(next) {
		params.logger.debug('Downloading ' + options.swaggerDocs);
		utils.hit(options.swaggerDocs, function downloadedMainAPIDoc(body) {
			async.each(body.apis, downloadAPI.bind(undefined, params), next);
		});
	});

	// Finally, handle the downloaded results (by turning them in to models).
	tasks.push(downloaded.bind(undefined, params));

	// That's it! After all of the tasks execute, exec our callback.
	return async.series(tasks, function(err) {
		if (err) {
			callback(err);
		}
		else {
			callback(null, params.models);
		}
	});
}

/**
 * Based on the provided login object, signs in to the server.
 * (Depending on the passed options, this function might not be called at all.)
 * @param params
 * @param next
 */
function wrappedLogin(params, next) {
	params.logger.debug('Signing in for auto discovery');
	var requestOptions = _.defaults(params.options.login, {
		jar: request.jar()
	});
	request(requestOptions, function loggedIn(err, response, body) {
		params.options.handleResponse(err, body, function handleLoginResponse(err, result) {
			if (err) {
				params.logger.error('Login failed. Please double check your credentials.');
				next(err);
			}
			else {
				params.options.jar = requestOptions.jar;
				next();
			}
		});
	});
}

/**
 * Downloads and parses the Swagger API endpoint specified.
 * @param params
 * @param api
 * @param next
 */
function downloadAPI(params, api, next) {
	var options = params.options;
	params.logger.debug('Downloading ' + options.swaggerDocs + api.path);

	var models = params.models;
	if (!models) {
		models = params.models = {};
	}

	utils.hit(options.swaggerDocs + api.path, function downloadedAPI(body) {
		var childAPIs = body.apis,
			tasks = [];

		for (var i = 0; i < childAPIs.length; i++) {
			var childAPI = childAPIs[i],
				modelName = utils.parseModelName(childAPI.path),
				pathVars = utils.parsePathVars(childAPI.path),
				url = body.basePath + childAPI.path,
				operations = childAPI.operations;

			for (var j = 0; j < operations.length; j++) {
				var operation = operations[j],
					methodName = utils.parseMethodName(options, operation.method, childAPI.path),
					model = models[modelName];

				if (!model) {
					model = models[modelName] = {
						methods: [],
						fields: {}
					};
				}
				var method = {
					// TODO: Need to implement method overriding (aka: same name, different signatures).
					name: methodName,
					pathParams: pathVars,
					verb: operation.method,
					url: url,
					operation: operation
				};
				model.methods.push(method);

				if (options.discoverFields && options.canDiscover(method)) {
					tasks.push(discoverEndpoint.bind(undefined, params, options, method, model.fields));
				}
			}

		}

		async.series(tasks, next);
	});
}

/**
 * Discovers the fields from the provided endpoint by hitting it.
 * (Depending on the passed options, this function might not be called at all.)
 * @param params
 * @param method
 * @param fields
 * @param next
 */
function discoverEndpoint(params, method, fields, next) {
	var options = params.options;
	params.logger.debug('Discovering fields from a ' + method.verb + ' to ' + method.url);

	request({
		uri: method.url,
		method: method.verb,
		jar: options.jar,
		json: true
	}, function discoveredEndpoint(err, response, body) {
		options.handleResponse(err, body, function handleEndpointResponse(err, result) {
			if (err) {
				next(err);
			}
			else {
				_.extend(fields, options.discoverFields(result));
				next();
			}
		});
	});
}

/**
 * Handles the final downloaded results.
 * @param params
 * @param next
 */
function downloaded(params, next) {
	var models = params.models;
	for (var modelName in models) {
		if (models.hasOwnProperty(modelName)) {
			params.logger.debug('Creating ' + modelName);
			params.connector && bindModelMethods(params, models[modelName] = model.createFromSwaggerModel({
				name: modelName,
				model: models[modelName]
			}));
		}
	}
	next && next();
}

/**
 * Binds the provided model's methods to the connector's execute function.
 * @param params
 * @param model
 */
function bindModelMethods(params, model) {
	var connector = params.connector,
		options = params.options,
		methods = _.keys(model.methods);

	for (var i = 0; i < methods.length; i++) {
		var name = methods[i],
			method = model.methods[name];

		model[name] = connector.execute.bind({
			model: model,
			connector: connector,
			methodName: name,
			method: method,
			handleResponse: options.handleResponse,
			getPrimaryKey: options.getPrimaryKey
		});
	}
}