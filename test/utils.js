var should = require('should'),
	utils = require('./../lib/utility/utils');

describe('Utils', function () {
	describe('#parseModelName()', function () {
		it('should ignore first segment if version', function () {
			utils.parseModelName('/v1/pet').should.equal('Pet');
			utils.parseModelName('/v1.2/pet').should.equal('Pet');
			utils.parseModelName('/2/pet').should.equal('Pet');
			utils.parseModelName('/2.1/pet').should.equal('Pet');
		});

		it('should use first path segment if not version', function () {
			utils.parseModelName('/order/status/{orderId}').should.equal('Order');
		});

		it('should strip periods and underscores, convert to UppercaseCamelCase', function () {
			utils.parseModelName('appc.salesforce_AcceptedEventRelation').should.equal('AppcSalesforceAcceptedEventRelation');
			utils.parseModelName('appc.arrowdb_acl').should.equal('AppcArrowdbAcl');
		});
	});

	describe('#parsePathVars()', function () {
		it('should be able to parse out single path variable', function () {
			var pathVars = utils.parsePathVars('/order/status/{orderId}');
			pathVars.length.should.equal(1);
			pathVars[0].should.equal('orderId');
		});

		it('should be able to parse out multiple path variables', function () {
			var pathVars = utils.parsePathVars('/acs/{app_guid}/push_devices/{app_env}/unsubscribe');
			pathVars.length.should.equal(2);
			pathVars[0].should.equal('app_guid');
			pathVars[1].should.equal('app_env');
		});
	});

	describe('#parseMethodName()', function () {
		it('should be able to generate method name', function () {
			var options = {
				verbMap: {
					POST: 'create',
					GET: 'find',
					PUT: 'update',
					DELETE: 'delete'
				}
			};
			utils.parseMethodName(options, 'GET', '/app').should.equal('findAll');
			utils.parseMethodName({}, 'GET', '/app').should.equal('findAll');
			utils.parseMethodName(options, 'POST', '/app').should.equal('create');
			utils.parseMethodName({}, 'POST', '/app').should.equal('create');
			utils.parseMethodName(options, 'GET', '/app/{id}').should.equal('findOne');
			utils.parseMethodName({}, 'GET', '/app/{id}').should.equal('findOne');
			utils.parseMethodName(options, 'POST', '/app/saveFromTiApp').should.equal('createSaveFromTiApp');
			utils.parseMethodName({}, 'POST', '/app/saveFromTiApp').should.equal('createSaveFromTiApp');
			utils.parseMethodName(options, 'PUT', '/app/{id}').should.equal('update');
			utils.parseMethodName({}, 'PUT', 'app/{id}').should.equal('update');
			utils.parseMethodName(options, 'GET', 'app/{app_guid}/module/{module_guid}/verification').should.equal('findModuleVerification');
			utils.parseMethodName({}, 'GET', '/app/{app_guid}/module/{module_guid}/verification').should.equal('findModuleVerification');
			utils.parseMethodName(options, 'DELETE', '/acs/{app_guid}/push_devices/{app_env}/unsubscribe').should.equal('deletePushDevicesUnsubscribe');
			utils.parseMethodName({}, 'DELETE', '/acs/{app_guid}/push_devices/{app_env}/unsubscribe').should.equal('deletePushDevicesUnsubscribe');
		});
	});

});
