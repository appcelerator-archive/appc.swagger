var should = require('should'),
	APIBuilder = require('appcelerator').apibuilder,
	server = new APIBuilder(),
	connector = server.getConnector('appc.swagger'),
	Connector = require('../lib').create(APIBuilder, server),
	config = new APIBuilder.Loader();

describe('Connector', function() {

	var AuthModel,
		FeedModel;

	before(function(next) {
		should(config.login).be.ok;
		should.notEqual(config.login.username, 'YOUR_APPCELERATOR_USERNAME', 'Please configure a username and password!');
		should.notEqual(config.login.password, 'YOUR_APPCELERATOR_PASSWORD', 'Please configure a username and password!');

		connector.connect(function(err) {
			should(err).be.not.ok;

			AuthModel = connector.getModel('Auth');
			should(AuthModel).be.ok;
			FeedModel = connector.getModel('Feed');
			should(FeedModel).be.ok;

			next();
		});
	});

	it('should be extensible', function() {
		var name = 'com.extension.test',
			ExtendedClass = Connector.extend({
				config: { dynamicallyLoadModels: false },
				name: name
			}),
			extendedInstance = new ExtendedClass();
		should(extendedInstance).be.ok;
		// Did our new properties get set correctly?
		should(extendedInstance.name).equal(name);
		should(extendedInstance.config.dynamicallyLoadModels).equal(false);
		// Did inherited properties make it through, too?
		should(extendedInstance.config.verbMap).be.an.Object;
	});

	it('should be able to fetch config', function(next) {
		connector.fetchConfig(function(err, config) {
			should(err).be.not.ok;
			should(config).be.an.Object;
			next();
		});
	});

	it('should be able to fetch metadata', function(next) {
		connector.fetchMetadata(function(err, meta) {
			should(err).be.not.ok;
			should(meta).be.an.Object;
			should(Object.keys(meta)).containEql('fields');
			next();
		});
	});

	it('should be able to find all instances', function(next) {

		AuthModel.createLogin(config.login, function(err) {
			should(err).be.not.ok;

			FeedModel.findAll(function(err, collection) {
				should(err).be.not.ok;
				should(collection.length).be.greaterThan(0);
				var first = collection[0];
				should(first.getPrimaryKey()).be.a.String;

				FeedModel.findOne(first.getPrimaryKey(), function(err, feed) {
					should(err).be.not.ok;
					should.equal(feed.getPrimaryKey(), first.getPrimaryKey());
					next();
				});
			});
		});

	});

	after(function(next) {
		server.stop(next);
	});

});
