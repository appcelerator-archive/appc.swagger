var APIBuilder = require('apibuilder'),
	server = new APIBuilder(),
	Connector = require('./lib'),
	connector = new Connector();

// lifecycle examples
server.on('starting', function() {
	server.logger.info('server is starting!');
});

server.on('started', function() {
	server.logger.info('server started!');
});

//--------------------- implement authorization ---------------------//

// fetch our configured apikey
var apikey = server.get('apikey');
server.logger.info('APIKey is:', apikey);

function APIKeyAuthorization(req, resp, next) {
	if (!apikey) {
		return next();
	}
	if (req.headers['apikey']) {
		var key = req.headers['apikey'];
		if (key === apikey) {
			return next();
		}
	}
	resp.status(401);
	return resp.json({
		id: 'com.appcelerator.api.unauthorized',
		message: 'Unauthorized',
		url: ''
	});
}

// add an authorization policy for all requests at the server log
server.authorization = APIKeyAuthorization;

// start the server
server.start(function() {
	server.logger.info('server started on port', server.port);
});
