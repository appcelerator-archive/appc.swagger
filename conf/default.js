module.exports = {
	// Configure connector.
	swaggerDocs: '',
	dynamicallyLoadModels: true,
	connectors: {},

	verbMap: {
		POST: 'create',
		GET: 'find',
		PUT: 'update',
		DELETE: 'delete'
	},
	canDiscover: function defaultCanDiscover(options, method) {
		return false;
	},
	getPrimaryKey: function(result) {
		return result._id || result.id || result.Id || result.guid;
	},
	handleResponse: function(err, body, next) {
		if (err) {
			next(err);
		}
		else {
			next(null, body);
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
