#!groovy
@Library('pipeline-library') _

timestamps {
	node('git && (osx || linux)') {
		stage('Checkout') {
			checkout scm
		}

		stage('Configuration') {
			sh "echo \"module.exports = { connectors: { 'appc.swagger': { swaggerDocs: 'http://petstore.swagger.io/v2/swagger.json', generateModelsFromSchema: true, modelAutogen: true, authenticationProvider: { }, handleResponse: function (err, response, body, next) { if (err) { return next(err); } if (typeof body === 'string') { return next(null, body); } if (typeof body === 'object') { if (body.hasOwnProperty('success')) { if (!body.success) { return next(body); } if (body.hasOwnProperty('key') && body.key && body.hasOwnProperty(body.key)) { return next(null, body[body.key]); }} return next(null, body.hasOwnProperty('result') ? body.result : body); } if (response.statusCode === 201 && response.headers) { var locationArr = response.headers.location.split('/'); return next(null, { id: locationArr[locationArr.length - 1] }); } return next(null, response); }, getPrimaryKey: function (result) { return result._id || result.id || result.Id || result.guid; }}}};\" > conf/local.js"
		}

		buildConnector {
			// don't override anything yet
		}
	}
}
