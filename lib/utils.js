var request = require('request'),
	_s = require('underscore.string');

/*
 Public API.
 */
exports.hit = hit;
exports.parseModelName = parseModelName;
exports.parsePathVars = parsePathVars;
exports.parseMethodName = parseMethodName;

/**
 * Hits the provided URL, and either throws an err, or calls the provided callback with the JSON response.
 * @param url
 * @param next
 */
function hit(url, next) {
	request(url, { json: true }, function downloadDocs(err, response, body) {
		if (err) {
			throw err;
		}
		else {
			next(body);
		}
	});
}

/**
 * Grabs the first component of the path as a name.
 * @param path
 * @returns {*}
 */
function parseModelName(path) {
	if ('/' === path.charAt(0)) {
		path = path.slice(1);
	}
	return _s.classify(path.split('/')[0]);
}

/**
 * Parses path variables from a swagger formatted URL.
 * @param url A swagger formatted url, such as http://foo.com/bar/{id}
 * @returns {Array}
 */
function parsePathVars(url) {
	return (url.match(/\{[^}]*\}/g) || []).map(function(pathVar) {
		return pathVar.slice(1, -1);
	});
}

/**
 * Turns an HTTP verb and path in to a method name.
 *
 * Examples:
 * GET app -> findAll
 * POST app -> create
 * GET app/{id} -> findOne
 * POST app/saveFromTiApp -> createSaveFromTiApp
 * PUT app/{id} -> updateOne
 * GET app/{app_guid}/module/{module_guid}/verification -> findModuleVerification
 * DELETE acs/{app_guid}/push_devices/{app_env}/unsubscribe -> deletePushDevicesUnsubscribe
 */
function parseMethodName(options, verb, path) {
	var name,
		components = path.split('/');

	// Ensure we have a verb.
	verb = (verb || 'GET').toUpperCase();
	// Remove the leading slash.
	if ('/' === path.charAt(0)) {
		components.splice(0, 1);
	}

	// Remove the first path component (it's the models name).
	components.splice(0, 1);

	// Turn the HTTP verb in to the start of the method name.
	name = options.verbMap[verb] || options.verbMap.GET;

	// Append the remaining path components as part of the name, excluding path vars.
	if (!components.length) {
		if (verb !== 'POST') {
			name += 'All';
		}
	}
	else {
		var allParams = true;
		for (var i = 0; i < components.length; i++) {
			var component = components[i];
			if (component.charAt(0) !== '{') {
				name += hasChars(component, '_-.') ? _s.classify(component) : _s.capitalize(component);
				allParams = false;
			}
		}
		if (allParams && verb === 'GET') {
			name += 'One';
		}
	}

	return name;
}

/**
 * Checks if a string contains at least one of the specified characters.
 * @param str A string, such as "foo".
 * @param chars A string or array, such as "fo" or [ 'f', 'o' ].
 * @returns {boolean}
 */
function hasChars(str, chars) {
	for (var i = 0; i < chars.length; i++) {
		if (hasChar(str, chars[i])) {
			return true;
		}
	}
	return false;
}

/**
 * Checks if a string contains the specified character.
 * @param str A string, such as "foo".
 * @param char A character, such as 'f'.
 * @returns {boolean}
 */
function hasChar(str, char) {
	return str.indexOf(char) >= 0;
}
