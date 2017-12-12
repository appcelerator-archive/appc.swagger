/**
 * Binds the provided model's methods to the connector's execute function.
 * @param model
 */
exports.bindModelMethods = function bindModelMethods (model) {
  var methods = Object.keys(model.methods)

  for (var i = 0; i < methods.length; i++) {
    var name = methods[i],
      method = model.methods[name],
      context = {
        model: model,
        connector: this,
        methodName: name,
        method: method,
        handleResponse: this.config.handleResponse,
        getPrimaryKey: this.config.getPrimaryKey
      }

    model[name] = this.execute.bind(context)
    model[name + 'API'] = this.describe.bind(context)
  }
}
