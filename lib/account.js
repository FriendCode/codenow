var util = require('util');
var _ = require('underscore');
var Q = require('q');
var Model = require('./model');

var Account = function(...args) {
    Model.apply(this, args);

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