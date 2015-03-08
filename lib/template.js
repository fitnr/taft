#!/usr/bin/env node

'use strict';

var clone = require('clone-object');
var extend = require('extend');

module.exports = template;

function template(Handlebars, content, options) {
    /*jshint validthis:true */
    this.Handlebars = Handlebars;

    this.content = content;

    this._data = options.data || {};

    this._helpers = {knownHelpers: options.helpers || Object.keys(Handlebars.helpers)};

    this.layout = options.layout || undefined;

    return this;
}

template.prototype.data = function() {
    return clone(this._data);
};

template.prototype.compile = function() {
    if (!this.hasOwnPrperty('_compile'))
        this._compile = this.Handlebars.compile(this.content, this._helpers);

    return this._compile;
};

template.prototype.build = function(data, options) {
    var override = (options.noOverride) ? false : true;

    var d = (override) ? extend(this.data(), data) : extend(data, this.data());

    return this.compile(d);
};
