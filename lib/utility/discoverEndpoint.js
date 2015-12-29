var _ = require('lodash'),
	request = require('request');

/**
 * Discovers the fields from the provided endpoint by hitting it.
 * (Depending on the passed options, this function might not be called at all.)
 * @param params
 * @param method
 * @param fields
 * @param next
 */
exports.discoverEndpoint = function discoverEndpoint(params, method, fields, next) {
	var config = this.config;
	params.logger.debug('Discovering fields from a ' + method.verb + ' to ' + method.url);

	request({
		uri: method.url,
		method: method.verb,
		jar: config.jar,
		json: true
	}, function (err, response, body) {
		config.handleResponse(err, body, function (err, result) {
			if (err) {
				next(err);
			} else {
				_.extend(fields, config.discoverFields(result));
				next();
			}
		});
	});
};
