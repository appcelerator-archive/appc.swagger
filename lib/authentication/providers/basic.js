/**
 * Contructor function for http basic authentication
 *
 * @param {string} username Username for basic authentication
 * @param {string} password Password for basic authentication
 */
var BasicAuthentication = module.exports = function (username, password) {
	this.username = username;
	this.password = password;
};

/**
 * Apply http basic auth by base64 encoding username and password and adding
 * the corrosponding header
 *
 * @param {Request} request Superagent request object
 * @param {Function} callback Function to call after authentication is applied
 * @return {void}
 */
BasicAuthentication.prototype.apply = function (request, callback) {
	request.auth(this.username, this.password);
	//request.set('Authentication', 'Basic ' + Buffer.from(this.username + ':' + this.password).toString('base64'));

	callback();
};
