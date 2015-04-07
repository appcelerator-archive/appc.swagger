var _ = require('lodash'),
	request = require('request'),
	async = require('async'),
	pkginfo = require('pkginfo')(module) && module.exports,
	defaultConfig = require('fs').readFileSync(__dirname + '/../conf/example.config.js', 'utf8');

var loader = require('./loader');

// --------- Swagger connector -------

exports.create = function(Arrow, server) {

	var Connector = Arrow.Connector,
		Collection = Arrow.Collection;

	return Connector.extend({
		/*
		 Configuration.
		 */
		config: Arrow.Loader(),
		pkginfo: _.pick(pkginfo, 'name', 'version', 'description', 'author', 'license', 'keywords', 'repository'),
		logger: server && server.logger || Arrow.createLogger({}, { name: pkginfo.name }),

		/*
		 Lifecycle.
		 */
		connect: function connect(callback) {
			var self = this;
			if (this.config.dynamicallyLoadModels) {
				loader.loadModels(Arrow, this, this.config, this.logger, function(err, models) {
					if (err) {
						callback(err);
					}
					else {
						self.models = _.defaults(self.models || {}, models);
						for (var key in models) {
							if (models.hasOwnProperty(key)) {
								server.addModel(models[key]);
							}
						}
						server.registerModelsForConnector(self, self.models);
						callback();
					}
				});
			}
			else {
				loader.bindModels({
					Arrow: Arrow,
					connector: this,
					models: this.models,
					logger: this.logger,
					options: this.config
				}, callback);
			}
		},
		disconnect: function disconnect(callback) {
			callback();
		},
		
		/*
		 Metadata.
		 */
		defaultConfig: defaultConfig,
		fetchMetadata: function fetchMetadata(callback) {
			callback(null, {
				fields: [
					Arrow.Metadata.URL({
						name: 'swaggerDocs',
						description: 'URL to the Swagger API Docs JSON',
						required: true
					})
				]
			});
		},

		/**
		 * Method Execution.
		 */
		execute: function execute() {
			var data = arguments[0],
				self = this,
				callback = arguments[arguments.length - 1],
				method = this.method,
				Model = this.model,
				options = {
					jar: this.connector.jar || (this.connector.jar = request.jar()),
					method: method.verb,
					uri: method.url,
					json: method.json
				};

			if (!_.isFunction(callback)) {
				throw new TypeError('The last argument to ' + this.methodName + ' must be a callback function.');
			}

			// Did we receive arguments?
			if (arguments.length > 1) {
				// Does our URL contain variables?
				if (options.uri.indexOf('{') >= 0) {
					var urlParams = options.uri.match(/\{[^}]+\}/g).map(function(v) {
						return v.slice(1, -1);
					});
					if (_.isString(data)) {
						var id = data;
						data = {};
						data[urlParams[0]] = id;
					}
					options.uri = _.template(options.uri.replace(/\{/g, "${"), data);
					data = _.omit(data, urlParams);
				}
				// TODO: Support sending data via query or headers, based on defined params.
				// Are we sending a body?
				if (method.verb === 'PUT' || method.verb === 'POST' || method.verb === 'PATCH') {
					options.body = data;
				}
				// Are we sending query string params?
				else {
					for (var key in data) {
						if (data.hasOwnProperty(key)) {
							options.uri += options.uri.indexOf('?') >= 0 ? '&' : '?';
							options.uri += key + '=' + encodeURIComponent(data[key]);
						}
					}
				}
			}

			request(options, function requestHandler(err, response, body) {
				self.handleResponse(err, body, function(err, result) {

					function createInstance(model) {
						if (Model._hasOwnFields === false || Object.keys(Model.fields).length === 0) {
							Model._hasOwnFields = false;
							for (var key in model) {
								if (model.hasOwnProperty(key)) {
									Model.fields[key] = { type: typeof model[key] };
								}
							}
						}
						var instance = Model.instance(model, true);
						instance.setPrimaryKey(self.getPrimaryKey(model));
						return instance;
					}

					if (err) {
						callback(err);
					}
					else {
						if (_.isArray(result)) {
							var array = result.map(createInstance);
							result = new Collection(Model, array);
						}
						else {
							result = createInstance(result);
						}
						callback(null, result);
					}
				});
			});
		},

		/**
		 * Method descriptions.
		 */
		describe: function describe() {
			var params = {};
			if (this.method.params) {
				for (var i = 0; i < this.method.params.length; i++) {
					var param = this.method.params[i];
					if (!param.name) {
						continue;
					}
					param.type = param.paramType || 'query';
					delete param.paramType;
					if (!param.description) {
						param.description = param.name;
					}
					param.optional = !param.required;
					params[param.name] = param;
				}
			}
			var path = '.' + this.method.path.replace(/\/\{([^}]+)\}/g, '/:$1');
			if (path.split('/')[1].toLowerCase() === this.model.name.toLowerCase()) {
				path = './' + path.split('/').slice(2).join('/');
			}
			console.log('this.methodName: ' + this.methodName);
			return {
				generated: true,
				uiSort: this.method.path.length,
				description: this.method.meta && this.method.meta.summary || this.methodName,
				path: path,
				actionGroup: this.methodName,
				method: this.method.verb,
				parameters: params,
				action: function describedAction(req, resp, next) {
					try {
						resp.stream(this.model[this.methodName], req.params, next);
					}
					catch (E) {
						return next(E);
					}
				}.bind(this)
			};
		}

	});

};