module.exports = {
	// Configure Connector.
	connectors: {
		'appc.swagger': {
			swaggerDocs: 'http://petstore.swagger.io/v2/swagger.json',
			modelAutogen: true,
			generateModelsFromSchema: true,
			login: {
				username: 'YOUR_APPCELERATOR_USERNAME',
				password: 'YOUR_APPCELERATOR_PASSWORD'
			},
			verbMap: {
				POST: 'create',
				GET: 'find',
				PUT: 'update',
				DELETE: 'delete'
			},
			getPrimaryKey: function (result) {
				return result._id || result.id || result.Id || result.guid;
			},
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
			}
		}
	},

	// Configure API Builder.
	logs: './logs',
	quiet: false,
	logLevel: 'debug',
	apikey: 'D4m7WdAi5XY05iotTOrXXWVqtfROYhy7',
	admin: {
		enabled: true,
		prefix: '/arrow'
	},
	session: {
		encryptionAlgorithm: 'aes256',
		encryptionKey: 'jdq/aehu5nnNE9JH4cJvDC0PtEPMJfHjLqkoICH8ahU=',
		signatureAlgorithm: 'sha512-drop256',
		signatureKey: '4e+4Cv/uZmPgr1jsDHFCyeyYvnPhLYN0LU9Q2TXTQdhpXHX2ugCxkctgOqzswpZFsCwQPBeAO/A46N32M81MQQ==',
		secret: 'ANmvWeOEyxuFSYFRq8B+tOoKxWJpcVPK', // should be a large unguessable string
		duration: 24 * 60 * 60 * 1000, // how long the session will stay valid in ms
		activeDuration: 1000 * 60 * 5 // if expiresIn < activeDuration, the session will be extended by activeDuration milliseconds
	}
};
