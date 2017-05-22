var should = require('should'),
	Arrow = require('arrow'),
	server,
	connector,
	config;

// Skip this test because when run in suite, only first swagger endpoint works.
describe('Petstore', function () {

	var PetModel,
		UserModel,
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
			UserModel = connector.getModel('User');
			should(UserModel).be.ok;
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
			should.ifError(err);

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

	//[ARRSOF-213] appc.swagger: Invoking petstore login kills arrow
	it('should be able to login as a user', function (next) {

		UserModel.loginUser({user: 'user1', pass: 'string'}, function (err, resp) {
			should.ifError(err);

			should(resp).be.ok;
			should(resp).be.a.String;
			next();
		});

	});

	it('should throw TypeError if callback function is not passed to API method call', function () {
		(function () {
			PetModel.findPetsByStatus({status: ['available']});
		}).should.throw();
	});

	after(function (next) {
		server.stop(next);
	});

});
