#!/usr/bin/env node

'use strict';

var clone = require('clone-object');
var extend = require('extend');

module.exports = template;

function template(Handlebars, content, options) {
    this._data = options.data || {};

    this.layout = options.layout || undefined;

    this.compile = Handlebars.compile(content, {
        knownHelpers: options.helpers || []
    });

    return this;
}

template.prototype.data = function() {
    return clone(this._data);
};

template.prototype.build = function(data, override) {
    override = override === undefined ? true : override;

    var d = (override) ? extend(this.data(), data) : extend(data, this.data());

    return this.compile(d);
};
