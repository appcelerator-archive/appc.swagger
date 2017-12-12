/**
 * Contructor function for http basic authentication
 *
 * @constructor
 * @param {string} username Username for basic authentication
 * @param {string} password Password for basic authentication
 */
var BasicAuthentication = module.exports = function (username, password) {
  this.username = username
  this.password = password
}

/**
 * Apply http basic auth by delegating to superagent's auth method.
 *
 * @param {Request} request Superagent request object
 * @param {Function} callback Function to call after authentication is applied
 * @see http://visionmedia.github.io/superagent/#authentication
 */
BasicAuthentication.prototype.apply = function (request, callback) {
  request.auth(this.username, this.password)

  callback()
}
