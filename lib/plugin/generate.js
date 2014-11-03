var _ = require('lodash'),
	appc = require('appc-cli-core'),
	async = require('async'),
	path = require('path'),
	fs = require('fs'),
	inquirer = require('inquirer'),
	apibuilder = require('apibuilder');

var TYPE = require('../../appc').TYPE,
	loader = require('../loader');

module.exports = {
	name: 'Swagger',
	type: TYPE,
	generator: true,
	execute: generate,

	// fields are inquirer.js "questions". There's a bit more
	// functionality, but it's not mandatory. I'll doc soon.
	fields: [
		{
			type: 'input',
			name: 'swaggerDocs',
			message: 'What is the URL to the main api-doc.json?',
			default: 'http://dashboard.appcelerator.com/api/v1/api-docs.json'
		}
	]
};

// opts will contain answers to all field questions
function generate(opts, callback) {

	var models,
		config;

	async.series([

		function(cb) {
			loader.loadModels(_.defaults(opts, require('../../conf/default')), null, function(err, _models) {
				models = _models;
				cb();
			});
		},

		function(cb) {
			var prompts = [
				{
					type: 'checkbox',
					name: 'apis',
					message: 'Which apis to use?',
					choices: _.keys(models).map(function(modelName) {
						return { name: modelName, value: modelName, checked: true };
					})
				}
			];
			inquirer.prompt(prompts, function(answers) {
				models = _.pick(models, answers.apis);
				cb();
			});
		},

		// generate a generic connector
		function(cb) {
			var cli = new apibuilder.CLI();
			cli.runCommand('new', ['connector'], function(err, results) {
				if (err) { return cb(err); }
				config = results;
				cb();
			});
		},

		// write out the configuration
		function(cb) {
			var local = path.join(config.dir, 'conf', 'local.js');
			var localConfig = _.pick(opts, 'swaggerDocs');
			localConfig.dynamicallyLoadModels = false;
			var content = 'module.exports=' + JSON.stringify(localConfig, '\t', 4) + ';';
			fs.writeFile(local, content, cb);
		},

		function(cb) {
			async.eachSeries(_.keys(models), function(model, done) {
				var obj = models[model];

				var buffer = "var APIBuilder = require('APIBuilder');\n\n";
				buffer += "var Model = APIBuilder.createModel('" + model.toLowerCase() + "'," + JSON.stringify(obj, '\t', 4) + ");\n\n";
				buffer += "module.exports = Model;\n";

				fs.writeFile(path.join(config.dir, 'models', model.toLowerCase() + '.js'), buffer, done);
			}, cb);
		},

		function(cb) {
			var from = path.join(__dirname, 'index.tjs'),
				to = path.join(config.dir, 'lib', 'index.js'),
				fromBuf = fs.readFileSync(from).toString(),
				toBuf = _.template(fromBuf, config);
			fs.writeFile(to, toBuf, cb);
		},

		function(cb) {
			var fromPKG = require(path.join(__dirname, '..', '..', 'package.json')),
				to = path.join(config.dir, 'package.json'),
				toPKG = require(to),
				ignore = ['inquirer', 'appc-cli-core']; // these packages don't need to be copied since they are used by this plugin

			// TODO: Once this module is published, we can use "'^' + fromPKG.version" instead.
			toPKG.dependencies[fromPKG.name] = 'git+ssh://' + fromPKG.repository.url;

			Object.keys(fromPKG.dependencies).forEach(function(name) {
				if (!(name in toPKG.dependencies) && ignore.indexOf(name) === -1) {
					toPKG.dependencies[name] = fromPKG.dependencies[name];
				}
			});

			fs.writeFile(to, JSON.stringify(toPKG, '\t', 4), cb);
		}

	], callback);

}