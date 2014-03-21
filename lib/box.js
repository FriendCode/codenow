var util = require('util');
var fs = require('fs');
var _ = require('underscore');
var request = require('superagent');
var Q = require('q');
var Model = require('./model');

var Box = function() {
	Model.apply(this, arguments);

	_.defaults(this, {
		'id': null,
		'name': null,
		'description': null,
		'public': true,
		'type': "premium",
		'owner': null,
		'createdAt': 0,
		'uptime': 0,
		'url': null,
		'collaborators': [ ]
	});

	this.content = function(output) {
		var stream = request.get(this.client.config.host+"/api/box/"+this.id+"/content")
		.set('Authorization', this.client.config.token);

		if (output) {
			var d = Q.defer();
			stream.on('data', function(chunk) {
				d.notify(chunk.length);
			});
			stream.on('end', function() {
				d.resolve();
			});
			stream.on('error', function(err) {
				d.reject(err);
			});
			stream.pipe(fs.createWriteStream(output));
			return d.promise;
		}

		return Q(stream);
	};
};
util.inherits(Box, Model);

module.exports = Box;