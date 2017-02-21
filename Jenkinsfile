#!groovy

@NonCPS
def jsonParse(def json) {
	new groovy.json.JsonSlurperClassic().parseText(json)
}

def packageVersion = ''
def changes = ''

timestamps {
	node('git && (osx || linux)') {
		stage('Checkout') {
			checkout scm
			def packageJSON = jsonParse(readFile('package.json'))
			packageVersion = packageJSON['version']
			changes = sh(returnStdout: true, script: "git log `git describe --tags --abbrev=0`..HEAD --oneline | sed 's/\$/\\\\/g'").trim()
		}

		def nodeHome = tool(name: 'node 4.7.3', type: 'jenkins.plugins.nodejs.tools.NodeJSInstallation')
		withEnv(["PATH+NODE=${nodeHome}/bin"]) {
			stage('Dependencies') {
				sh 'npm install appcelerator'
				sh 'npm install'
				sh './node_modules/.bin/appc logout'
				sh './node_modules/.bin/appc config set defaultEnvironment preprod'

				withCredentials([usernamePassword(credentialsId: '65f9aaaf-cfef-4f22-a8aa-b1fb0d934b64', passwordVariable: 'PASS', usernameVariable: 'USER')]) {
					sh './node_modules/.bin/appc login --username "$USER" --password "$PASS" -l trace'
				}

				sh './node_modules/.bin/appc install'
			}

			stage('Build') {
				sh 'npm install grunt-cli --save-dev'
				sh("echo \"module.exports = { logLevel: 'error', connectors: { 'appc.swagger': { swaggerDocs: 'http://dashboard.appcelerator.com/api/v1/api-docs.json', login: { username: 'dawson.toth+testing@gmail.com', password: 'mmpResearch5'}, handleResponse: function (err, response, body, next) { if (err) { next(err); } else if ((body.hasOwnProperty('success') && !body.success) || (response.statusCode < 200 || response.statusCode > 299)) { next(body); } else { next(null, body.hasOwnProperty('result') ? body.result : body); } } }}};\" > conf/local.js")
				sh 'npm test'
			}

			stage('Results') {
				fingerprint '**/appc*/package.json, **/arrow/package.json, package.json'
				// TODO: tag in git?
				// TODO: send email?
				// TODO: Set github commit status
				// Update JIRA
				withEnv(["CHANGES=${changes}"]) {
					step([$class: 'hudson.plugins.jira.JiraIssueUpdater',
						issueSelector: [$class: 'hudson.plugins.jira.selector.DefaultIssueSelector'],
						scm: scm])
				}
			}

			stage('Publish') {
				sh 'DEBUG=* ./node_modules/.bin/appc publish --no-progress-bars -l trace --force'
			}
		}
	}
}
