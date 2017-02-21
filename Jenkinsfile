#!groovy
@Library('pipeline-library') _

timestamps {
	node('git && (osx || linux)') {
		stage('Checkout') {
			checkout scm
		}

		stage('Configuration') {
			sh "echo \"module.exports = { logLevel: 'error', connectors: { 'appc.swagger': { swaggerDocs: 'http://dashboard.appcelerator.com/api/v1/api-docs.json', login: { username: 'dawson.toth+testing@gmail.com', password: 'mmpResearch5'}, handleResponse: function (err, response, body, next) { if (err) { next(err); } else if ((body.hasOwnProperty('success') && !body.success) || (response.statusCode < 200 || response.statusCode > 299)) { next(body); } else { next(null, body.hasOwnProperty('result') ? body.result : body); } } }}};\" > conf/local.js"
		}

		buildConnector {
			// don't override anything yet
		}
	}
}
