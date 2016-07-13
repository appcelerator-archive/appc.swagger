/**
 * Describes the generated method for API generation.
 * @returns {{generated: boolean, uiSort: *, description: (Error.body.meta|{code, status, message}|Model.meta|{azure}|Car.meta|boolean|*), path: string, dependsOnAll: string[], actionGroup: *, method: *, parameters, action: describedAction}}
 */
exports.describe = function describe() {
	var context = this,
		params = {};
	if (this.method.params) {
		for (var i = 0; i < this.method.params.length; i++) {
			var param = this.method.params[i];
			if (!param.name) {
				continue;
			}
			param.dataType = param.type;
			param.type = param.in || 'query';
			delete param.in;
			if (!param.description) {
				param.description = param.name;
			}
			param.optional = !param.required;
			params[param.name] = param;
		}
	}
	var path = '.' + this.method.path.replace(/\/\{([^}]+)\}/g, '/:$1');
	// Drop model name from URL path
	var modelName = this.model.name;
	if (modelName.indexOf('appc.swagger/') === 0) {
		modelName = modelName.slice(13);
	}
	if (path.split('/')[1].toLowerCase() === modelName.toLowerCase()) {
		path = './' + path.split('/').slice(2).join('/');
	}

	return {
		generated: true,
		uiSort: this.method.path.length,
		description: this.method.meta && this.method.meta.summary || this.methodName,
		path: path,
		dependsOnAll: ['describe', 'execute'],
		actionGroup: this.methodName,
		method: this.method.verb,
		parameters: translateParams(params),
		/**
		 * Streams the results of executing the method to the response.
		 * @param req
		 * @param resp
		 * @param next
		 * @returns {*}
		 */
		action: function describedAction(req, resp, next) {
			try {
				resp.stream(context.model[context.methodName], req.params, next);
			}
			catch (E) {
				return next(E);
			}
		}
	};
};

/**
 * Looks through the Swagger parameters and translates them for usage in Arrow.
 * @param params
 * @returns {*}
 */
function translateParams(params) {
	for (var key in params) {
		if (params.hasOwnProperty(key)) {
			var param = params[key];
			if (param.type === 'formData') {
				param.type = 'body';
			} else if (param.type === 'header') {
				delete params[key];
			}
		}
	}
	return params;
}
