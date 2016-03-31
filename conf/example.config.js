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
			 * Should we auto-discover payloads from your Swagger API? If this returns true for a particular method,
			 * then the API will make sure you are logged in (using the credentials below) and then it will
			 * introspectively set the fields on the model based on the response we receive.
			 *
			 * Hint: It's most useful to return true when doing a GET findAll.
			 */
			canDiscover: function defaultCanDiscover(options, method) {
				return false;
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
					next(err);
				}
				else if ((body.hasOwnProperty('success') && !body.success) || (response.statusCode < 200 || response.statusCode > 299)) {
					next(body);
				}
				else {
					next(null, body.hasOwnProperty('result') ? body.result : body);
				}
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
