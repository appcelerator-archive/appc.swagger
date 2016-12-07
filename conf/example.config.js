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
			 * When we retrieve your Swagger API spec, what authentication do we need
			 * to use? We can do basic authentication or we can do API Key authentication.
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
			 * Mapping of swagger security definitions to authentication providers
			 */
			authenticationProvider: {
				/*
				// Api key
				api_key: {
					value: 'special-key'
				},

				// Basic
				basic: {
					username: 'boblee',
					password: 'swagger'
				},

				// Oauth password flow example
				oauth_pass: {
					client_id: 'id',
					client_secret: 'super_secret',
					username: 'boblee',
					password: 'swagger',
					// Sets the content type all oauth requests use to encode their body.
					// Can be 'form' or 'json', defaults to 'form' if not set.
					requestContentType: 'json'
				},

				// Oauth application/client credential flow example
				oauth_client: {
					client_id: 'id',
					client_secret: 'super_secret',
					// If your server does not provide the expires_in key for new access tokens
					// you can set a default expiry time in seconds here. If not specified
					// AND the expires_in key is missing, a default of 3600 will be used
					defaultAccessTokenExpiryTime: 7200,
					// Same as above but for refresh tokens. If you ommit this it will be assumed
					// the refresh token is a long lasting token without any expiry time.
					defaultRefreshTokenExpiryTime: 1209600
				}
				*/
			},

			/**
			 * Handles a response from your API before this connector further processes
			 * it and tries to create the models from that response.
			 *
			 * Here you can detect if the response is an error or a successful
			 * response and do any required transformation to the response. This
			 * example implementation should work with most APIs and also includes
			 * some special cases for when use the generated Swagger definition from
			 * another Arrow API.
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