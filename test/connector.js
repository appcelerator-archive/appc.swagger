var should = require('should'),
	Arrow = require('arrow'),
	server = new Arrow(),
	connector = server.getConnector('appc.swagger'),
	config = connector.config;

describe('Connector', function () {

	var AuthModel,
		FeedModel;

	before(function (next) {
		should(config.login).be.ok;
		should.notEqual(config.login.username, 'YOUR_APPCELERATOR_USERNAME', 'Please configure a username and password!');
		should.notEqual(config.login.password, 'YOUR_APPCELERATOR_PASSWORD', 'Please configure a username and password!');

		connector.connect(function (err) {
			should(err).be.not.ok;

			AuthModel = connector.getModel('Auth');
			should(AuthModel).be.ok;
			FeedModel = connector.getModel('Feed');
			should(FeedModel).be.ok;

			next();
		});
	});

	it('should be able to fetch metadata', function (next) {
		connector.fetchMetadata(function (err, meta) {
			should(err).be.not.ok;
			should(meta).be.an.Object;
			should(Object.keys(meta)).containEql('fields');
			next();
		});
	});

	it('should be able to find all instances', function (next) {

		AuthModel.createLogin(config.login, function (err) {
			should(err).be.not.ok;

			FeedModel.findAll(function (err, collection) {
				should(err).be.not.ok;
				if (collection.length <= 0) {
					return next();
				}
				var first = collection[0];
				should(first.getPrimaryKey()).be.a.String;

				FeedModel.findOne(first.getPrimaryKey(), function (err, feed) {
					should(err).be.not.ok;
					should.equal(feed.getPrimaryKey(), first.getPrimaryKey());
					next();
				});
			});
		});

	});

	after(function (next) {
		server.stop(next);
	});

});
