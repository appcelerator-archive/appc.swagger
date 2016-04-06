module.exports = {
	// Configure Connector.
	connectors: {
		'appc.swagger': {
			swaggerDocs: 'http://dashboard.appcelerator.com/api/v1/api-docs.json',
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
					next(err);
				}
				else if ((body.hasOwnProperty('success') && !body.success) || (response.statusCode < 200 || response.statusCode > 299)) {
					next(body);
				}
				else {
					next(null, body.hasOwnProperty('result') ? body.result : body);
				}
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
