module.exports = {
	connectors: {
		'appc.swagger': {
			// The URL to the main api-docs for your Swagger API.
			swaggerDocs: 'http://dashboard.appcelerator.com/api/v1/api-docs.json',

			// Create models based on your schema that can be used in your API.
			generateModelsFromSchema: true,

			// Whether or not to generate APIs based on the methods in generated models.
			modelAutogen: false,

			// Maps HTTP verbs to method names on your models.
			verbMap: {
				POST: 'create',
				GET: 'find',
				PUT: 'update',
				DELETE: 'delete'
			},

			/**
			 * When we log in to your Swagger API, what authentication do we need to use? We can do basic authentication
			 * or we can do API Key authentication.
			 */
			login: {
				//username: 'USERNAME',
				//password: 'PASSWORD'
				// OR
				// apiKey: {
				//     type: 'header', // or 'query'
				//     name: 'API_KEY_NAME',
				//     value: 'API_KEY'
				// }
			},

			/**
			 * Detect if the response is an error, or a successful response.
			 */
			handleResponse: function (err, response, body, next) {
				if (err) {
					return next(err);
				}

				// check if body exists first
				if (typeof body === 'object') {
					if (body.hasOwnProperty('success')) {
						if (!body.success) {
							return next(body);
						}
						if (body.hasOwnProperty('key') && body.key && body.hasOwnProperty(body.key)) {
							return next(null, body[body.key]);
						}
					}

					return next(null, body.hasOwnProperty('result') ? body.result : body);
				}

				/**
				 * On POST request the response status is 201 and the location of the created model is
				 * in response.headers.location.
				 */
				if (response.statusCode === 201 && response.headers) {
					/**
					 * Extracts created object's id from the location header.
					 * The location from response.headers.location follows the pattern {url}/{model}/{:id}
					 * and we have to parse the id of the newly created object in order to return it like response.
					 */
					var locationArr = response.headers.location.split('/');
					return next(null, { id: locationArr[locationArr.length - 1] });
				}

				return next(null, response);
			},

			/**
			 * Returns the primary key from a successful payload from your server.
			 */
			getPrimaryKey: function (result) {
				return result._id || result.id || result.Id || result.guid;
			}
		}
	}
};