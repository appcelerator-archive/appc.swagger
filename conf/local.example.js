module.exports = {
	swaggerDocs: 'http://dashboard.appcelerator.com/api/v1/api-docs.json',

	login: {
		// TODO: Use your Appcelerator credentials below.
		username: 'YOUR_APPCELERATOR_USERNAME',
		password: 'YOUR_APPCELERATOR_PASSWORD'
	},
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
	}
};
