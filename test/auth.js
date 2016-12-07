var should = require('should'),
	nock = require('nock'),
	request = require('superagent'),
	Arrow = require('arrow'),
	server,
	connector,
	config,
	auth = require('../lib/authentication/auth'),
	ApiKeyAuthentication = require('../lib/authentication/providers/api-key'),
	BasicAuthentication = require('../lib/authentication/providers/basic'),
	OauthAuthentication = require('../lib/authentication/providers/oauth');

/**
 * Resolves a auth provider for the given security requirement and checks
 * if it's of the given provider type
 *
 * @param {Object} securityRequirement The security required used to resolve the provider
 * @param {Function} providerObjectType Provider object type used to type check the found provider
 * @return {Object} Found authentication provider instance
 */
function resolveAndValidateProvider(securityRequirement, providerObjectType) {
	var providers = auth.resolveAuthenticationProviders(connector, securityRequirement);
	providers.should.have.length(1);
	var provider = providers[0];
	provider.should.be.an.instanceOf(providerObjectType);
	return provider;
}

/**
 * Resets an oauth provider by setting the token to null
 *
 * @param {OauthAuthentication} provider Oauth authentication provider
 */
function resetOauthProvider(provider) {
	provider.token = null;
}

describe('Authentication', function () {
	before(function (next) {
		server = new Arrow({overrideLevel: 'info'});
		connector = server.getConnector('appc.swagger');
		config = connector.config;

		// adjust config for testing purposes
		config.swaggerDocs = 'http://petstore.swagger.io/v2/swagger.json';
		config.authenticationProvider = {
			api_key: {
				value: 'special-key'
			},
			basic: {
				username: 'boblee',
				password: 'swagger',
				securityDefinition: {
					type: 'basic'
				}
			},
			oauth_password: {
				client_id: 'id',
				client_secret: 'super_secret',
				username: 'boblee',
				password: 'swagger',
				requestContentType: 'json',
				securityDefinition: {
					type: 'oauth2',
					flow: 'password',
					tokenUrl: 'http://localhost/oauth/token'
				}
			},
			oauth_client: {
				client_id: 'id',
				client_secret: 'super_secret',
				requestContentType: 'json',
				securityDefinition: {
					type: 'oauth2',
					flow: 'application',
					tokenUrl: 'http://localhost/oauth/token'
				}
			}
		};

		connector.connect(function (err) {
			should.ifError(err);
			next();
		});
	});

	it('should add swagger security definition to provider config', function () {
		connector.config.authenticationProvider.api_key.securityDefinition.should.be.eql({
			type: 'apiKey',
			name: 'api_key',
			in: 'header'
		});
	});

	describe('Resolver', function () {
		it('should return empty array if no provider found', function () {
			var securityRequirement = [{na: []}];
			var providers = auth.resolveAuthenticationProviders(connector, securityRequirement);
			providers.should.be.empty;
		});

		it('should return all required providers', function () {
			var securityRequirement = [{api_key: [], basic: []}];
			var providers = auth.resolveAuthenticationProviders(connector, securityRequirement);
			providers.should.have.length(2);
			providers[0].should.be.an.instanceOf(ApiKeyAuthentication);
			providers[1].should.be.an.instanceOf(BasicAuthentication);
		});
	});

	describe('HTTP basic provider', function () {
		it('should resolve configured basic authentication provider', function () {
			var providerConfig = connector.config.authenticationProvider.basic;
			var provider = resolveAndValidateProvider([{basic: []}], BasicAuthentication);
			provider.username.should.be.equal(providerConfig.username);
			provider.password.should.be.equal(providerConfig.password);
		});

		it('should apply basic auth header to request', function (next) {
			var username = connector.config.authenticationProvider.basic.username;
			var password = connector.config.authenticationProvider.basic.password;
			var provider = resolveAndValidateProvider([{basic: []}], BasicAuthentication);

			var r = request.get('/test');
			provider.apply(r, function () {
				var authHeaderValue = r.get('Authorization');
				authHeaderValue.should.be.equal('Basic ' + new Buffer(username + ':' + password).toString('base64'));
				next();
			});
		});
	});

	describe('API key provider', function () {
		it('should resolve configured api key authentication provider', function () {
			var providerConfig = connector.config.authenticationProvider.api_key;
			var provider = resolveAndValidateProvider([{api_key: []}], ApiKeyAuthentication);
			provider.name.should.be.equal(providerConfig.securityDefinition.name);
			provider.value.should.be.equal(providerConfig.value);
			provider.type.should.be.equal(providerConfig.securityDefinition.in);
		});

		it('should apply api key as header field', function (next) {
			var provider = resolveAndValidateProvider([{api_key: []}], ApiKeyAuthentication);
			// swagger petstore default is to add the api key as header field
			var r = request.get('/test');
			provider.apply(r, function () {
				var apiKeyHeaderValue = r.get(provider.name);
				apiKeyHeaderValue.should.be.ok;
				apiKeyHeaderValue.should.be.equal(provider.value);
				next();
			});
		});

		it('should apply api key as query parameter', function (next) {
			var provider = resolveAndValidateProvider([{api_key: []}], ApiKeyAuthentication);
			// change to query type to also test this case
			provider.type = 'query';

			var r = request.get('/test');
			provider.apply(r, function () {
				var queryArguments = r.qs;
				should(queryArguments).be.ok;
				queryArguments.should.containEql(Object.defineProperty({}, provider.name, {value: provider.value}));
				next();
			});
		});
	});

	describe('Oauth2 provider', function () {
		it('should resolve configured oauth2 provider', function () {
			var provider = resolveAndValidateProvider([{oauth_password: []}], OauthAuthentication);

			var providerConfig = connector.config.authenticationProvider.oauth_password;
			provider.providerConfig.should.be.eql(providerConfig);
			provider.tokenUrl.should.be.equal(providerConfig.securityDefinition.tokenUrl);
			provider.flow.should.be.equal(providerConfig.securityDefinition.flow);
		});

		it('should apply bearer token with password flow', function (next) {
			var provider = resolveAndValidateProvider([{oauth_password: []}], OauthAuthentication);

			var providerConfig = connector.config.authenticationProvider.oauth_password;
			var testToken = '123456';
			nock('http://localhost')
				.post('/oauth/token', {
					grant_type: 'password',
					username: providerConfig.username,
					password: providerConfig.password,
					client_id: providerConfig.client_id,
					client_secret: providerConfig.client_secret
				})
				.reply(200, {
					access_token: testToken
				});

			var r = request.get('/test');
			provider.apply(r, function (err) {
				should.ifError(err);
				var authHeaderValue = r.get('Authorization');
				should(authHeaderValue).be.ok;
				authHeaderValue.should.be.equal('Bearer ' + testToken);
				next();
			});
		});

		it('should apply bearer token with application flow', function (next) {
			var provider = resolveAndValidateProvider([{oauth_client: []}], OauthAuthentication);

			var providerConfig = connector.config.authenticationProvider.oauth_client;
			var testToken = '654321';
			nock('http://localhost')
				.post('/oauth/token', {
					grant_type: 'client_credentials',
					client_id: providerConfig.client_id,
					client_secret: providerConfig.client_secret
				})
				.reply(200, {
					access_token: testToken
				});

			var r = request.get('/test');
			provider.apply(r, function (err) {
				should.ifError(err);
				var authHeaderValue = r.get('Authorization');
				should(authHeaderValue).be.ok;
				authHeaderValue.should.be.equal('Bearer ' + testToken);
				next();
			});
		});

		it('should use refresh token to request new access token', function (next) {
			var provider = resolveAndValidateProvider([{oauth_password: []}], OauthAuthentication);
			resetOauthProvider(provider);
			var providerConfig = connector.config.authenticationProvider.oauth_client;
			var testToken = '987654';

			// populate provider with expired mock token
			provider.token = {
				accessToken: '123456',
				expiryDate: new Date(),
				refreshToken: '654321'
			};

			nock('http://localhost')
				.post('/oauth/token', {
					grant_type: 'refresh_token',
					refresh_token: provider.token.refreshToken,
					client_id: providerConfig.client_id,
					client_secret: providerConfig.client_secret
				})
				.reply(200, {
					access_token: testToken
				});

			var r = request.get('/test');
			provider.apply(r, function (err) {
				should.ifError(err);
				var authHeaderValue = r.get('Authorization');
				should(authHeaderValue).be.ok;
				authHeaderValue.should.be.equal('Bearer ' + testToken);
				next();
			});
		});
	});
});
