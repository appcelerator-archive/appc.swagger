module.exports = {
	connectors: {
		'appc.swagger': {
			// The URL to the main api-docs for your Swagger API.
			swaggerDocs: 'http://dashboard.appcelerator.com/api/v1/api-docs.json',

			// Create models based on the Swagger API that can be used in your API.
			dynamicallyLoadModels: true,

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

			/*
			 When we log in to your Swagger API, what username and password should we use? This is only used
			 for auto-discovery.
			 */
			login: {
				username: 'YOUR_APPCELERATOR_USERNAME',
				password: 'YOUR_APPCELERATOR_PASSWORD'
			},

			/**
			 * Detect if the response is an error, or a successful response.
			 */
			handleResponse: function(err, body, next) {
				if (err) {
					next(err);
				}
				else if (!body.success) {
					next(body);
				}
				else {
					next(null, body.result);
				}
			},

			/**
			 * Returns the primary key from a successful payload from your server.
			 */
			getPrimaryKey: function(result) {
				return result._id || result.id || result.Id || result.guid;
			},

			/**
			 * Discovers fields from a successful response.
			 * @param result
			 * @returns {{foo: {type: Function}, bar: {type: Function}}}
			 */
			discoverFields: function discoverFields(result) {
				return {
					foo: { type: String },
					bar: { type: Number }
				};
			}

		}
	}
};