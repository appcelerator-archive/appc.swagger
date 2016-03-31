var should = require('should'),
	Arrow = require('arrow'),
	server,
	connector,
	config;

describe('Petstore', function () {

	var PetModel,
		OrderModel;

	before(function (next) {
		server = new Arrow();
		connector = server.getConnector('appc.swagger');
		config = connector.config;

		// hack it
		config.swaggerDocs = 'http://petstore.swagger.io/v2/swagger.json';
		config.login.username = null;
		config.login.password = null;

		connector.connect(function (err) {
			should(err).be.not.ok;

			PetModel = connector.getModel('Pet');
			should(PetModel).be.ok;
			OrderModel = connector.getModel('Order');
			should(OrderModel).be.ok;

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

		PetModel.findPetsByStatus({status: ['available']}, function (err, collection) {
			should(err).be.not.ok;

			if (collection.length <= 0) {
				return next();
			}
			var first = collection[0];
			should(first.getPrimaryKey()).be.ok;

			PetModel.getPetById(first.getPrimaryKey(), function (err, pet) {
				should(err).be.not.ok;
				should.equal(pet.getPrimaryKey(), first.getPrimaryKey());
				next();
			});
		});

	});

	after(function (next) {
		server.stop(next);
	});

});
