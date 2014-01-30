var util = require('util');
var _ = require('underscore');
var Q = require('q');
var Model = require('./model');

var Account = function() {
    Model.apply(this, arguments);

    _.defaults(this, {
        'token': null,
        'name': null,
        'publicKey': null,
        'plan': {},
        'boxes': 0,
        'repos': [ ]
    });
};
util.inherits(Account, Model);

module.exports = Account;