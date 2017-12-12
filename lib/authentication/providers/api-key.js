/**
 * Constructor function for api key authentication
 *
 * @constructor
 * @param {string} name Name of the header field or query parameter to use
 * @param {string} value The value of your api key
 * @param {string} type Either 'header' or 'query'
 */
var ApiKeyAuthentication = module.exports = function (name, value, type) {
  this.name = name
  this.value = value
  if (type !== 'header' && type !== 'query') {
    throw new Error('The type "' + type + '" for api key authentication is invalid, it must be either "header" or "query".')
  }
  this.type = type
}

/**
 * Apply api key either as header value or query parameter to the request
 *
 * @param {Request} request Superagent request object
 * @param {Function} callback Function to call after authentication is applied
 */
ApiKeyAuthentication.prototype.apply = function (request, callback) {
  if (this.type === 'query') {
    request.query(Object.defineProperty({}, this.name, {
      value: this.value,
      writable: true,
      enumerable: true,
      configurable: true
    }))
  } else if (this.type === 'header') {
    request.set(this.name, this.value)
  }

  callback()
}
