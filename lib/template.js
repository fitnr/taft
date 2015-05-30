#!/usr/bin/env node

'use strict';

var merge = require('merge');

module.exports = template;

function template(content, options) {
    /*jshint validthis:true */
    this.content = content;

    options = options || {};

    this._data = options.data || {};

    this._handlebarsOpts = merge(options.handlebarsOpts || {}, {knownHelpers: options.helpers || []});

    this.layout = options.layout || undefined;

    return this;
}

Object.defineProperty(template.prototype, 'data', {
    get: function() {
        return merge.clone(this._data);
    },
    enumerable: true,
});

template.prototype.compile = function(Handlebars) {
    if (!('_compile' in this))
        this._compile = Handlebars.compile(this.content, this._handlebarsOpts);

    return this._compile;
};

template.prototype.build = function(Handlebars, data, options) {
    options = options || {};

    var override = (options.noOverride) ? false : true;

    var d = (override) ? merge(this.data, data) : merge(data, this.data);
    return new Content(this.compile(Handlebars)(d));
};

function Content(string) {
    this._content = string;
    return this;
}

Content.prototype.toString = function() {
  return this._content;
};
