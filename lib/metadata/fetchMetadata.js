var Arrow = require('arrow');

/**
 * Fetches metadata describing your connector's proper configuration.
 * @param next
 */
exports.fetchMetadata = function fetchMetadata(next) {
	next(null, {
		fields: [
			Arrow.Metadata.URL({
				name: 'swaggerDocs',
				description: 'URL to the Swagger API Docs JSON',
				required: true
			})
		]
	});
};
