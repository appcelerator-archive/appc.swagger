var _ = require('lodash'),
	async = require('async'),
	path = require('path'),
	fs = require('fs');

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
function generate(appc, opts, callback) {
	var models,
		config;
	
	var arrow = appc.arrow,
		inquirer = appc.inquirer;

	async.series([

		// download the swagger doc, and all of its child APIs
		function(cb) {
			loader.loadModels(arrow, null, _.defaults(opts, require('../../conf/default')), null, function(err, _models) {
				models = _models;
				cb();
			});
		},

		// ask which of the child APIs we should generate models for
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
			var cli = new arrow.CLI();
			cli.runCommand('new', ['connector'], function(err, results) {
				if (err) { return cb(err); }
				config = results;
				cb();
			});
		},

		// create the local configuration
		function(cb) {
			var local = path.join(config.dir, 'conf', 'local.js');
			var localConfig = _.pick(opts, 'swaggerDocs');
			localConfig.dynamicallyLoadModels = false;
			var content = 'module.exports=' + JSON.stringify(localConfig, null, '\t') + ';';
			fs.writeFile(local, content, cb);
		},

		// update the default configuration
		function(cb) {
			var from = require('../../conf/default');
			var intoPath = path.join(config.dir, 'conf', 'default.js');
			var into = require(intoPath);
			_.defaults(into, from);
			var content = 'module.exports=' + JSON.stringify(into, function(key, value) {
					return typeof value === 'function' ? value.toString() : value;
				}, '\t').replace(/": "(function[^\n]*)"/g, function(match, capture) {
					return '": ' + capture
							.replace(/\\r/g, '\r')
							.replace(/\\n/g, '\n')
							.replace(/\\t/g, '\t');
				}) + ';';
			fs.writeFile(intoPath, content, cb);
		},

		// write out the models
		function(cb) {
			async.eachSeries(_.keys(models), function(model, done) {
				var obj = models[model];

				var buffer = "var Arrow = require('arrow');\n\n";
				buffer += "var Model = Arrow.Model.extend('" + model + "'," + JSON.stringify(obj, null, '\t') + ");\n\n";
				buffer += "module.exports = Model;\n";

				fs.writeFile(path.join(config.dir, 'models', model.toLowerCase() + '.js'), buffer, done);
			}, cb);
		},

		// create a lib/index.js
		function(cb) {
			var from = path.join(__dirname, 'index.tjs'),
				to = path.join(config.dir, 'lib', 'index.js'),
				fromBuf = fs.readFileSync(from).toString(),
				toBuf = _.template(fromBuf, config);
			fs.writeFile(to, toBuf, cb);
		},

		// copy test/connector.js
		function(cb) {
			var from = path.join(__dirname, '..', '..', 'test', 'connector.js'),
				to = path.join(config.dir, 'test', 'connector.js'),
				fromBuf = fs.readFileSync(from, 'utf8');
			fs.writeFile(to, fromBuf, cb);
		},

		// make sure all the necessary dependencies get mixed in
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

			fs.writeFile(to, JSON.stringify(toPKG, null, '\t'), cb);
		}

	], callback);

}