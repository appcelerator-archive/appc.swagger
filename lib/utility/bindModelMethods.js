/**
 * Binds the provided model's methods to the connector's execute function.
 * @param model
 */
module.exports = function (connector, model) {
	var methods = Object.keys(model.methods);

	for (var i = 0; i < methods.length; i++) {
		var name = methods[i],
			method = model.methods[name],
			context = {
				model: model,
				connector: connector,
				methodName: name,
				method: method,
				handleResponse: connector.config.handleResponse,
				getPrimaryKey: connector.config.getPrimaryKey
			};

		model[name] = connector.execute.bind(context);
		model[name + 'API'] = connector.describe.bind(context);
	}
};
