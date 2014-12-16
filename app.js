/**
 * NOTE: This file is simply for testing this connector and will not
 * be used or packaged with the actual connector when published.
 */
var APIBuilder = require('appcelerator').apibuilder,
	server = new APIBuilder(),
	connector = server.getConnector('appc.swagger');

server.start();