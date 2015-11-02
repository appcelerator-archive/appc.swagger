var _ = require('lodash'),
	request = require('request');

/**
 * Based on the provided login object, signs in to the server.
 * (Depending on the passed options, this function might not be called at all.)
 * @param params
 * @param next
 */
exports.wrappedLogin = function wrappedLogin(params, next) {
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
};
