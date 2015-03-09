#!/usr/bin/env node

'use strict';

var extend = require('extend');

module.exports = template;

function template(content, options) {
    /*jshint validthis:true */
    this.content = content;

    this._data = options.data || {};

    this._helpers = {knownHelpers: options.helpers || []};

    this.layout = options.layout || undefined;

    return this;
}

Object.defineProperty(template.prototype, 'data', {
    get: function() {
        return this._data;
    },
    enumerable: true,
});

template.prototype.compile = function(Handlebars) {
    if (!this.hasOwnProperty('_compile'))
        this._compile = Handlebars.compile(this.content, this._helpers);

    return this._compile;
};

template.prototype.build = function(Handlebars, data, options) {
    options = options || {};

    var override = (options.noOverride) ? false : true;

    var d = (override) ? extend(this.data, data) : extend(data, this.data);
    return new Content(this.compile(Handlebars)(d));
};

function Content(string) {
    this._content = string;
    return this;
}

Content.prototype.toString = function() {
  return this._content;
};
