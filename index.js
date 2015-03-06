#!/usr/bin/env node
'use strict';

var fs = require('fs'),
    path = require('path'),
    extend = require('extend'),
    clone = require('clone-object'),
    Handlebars = require('handlebars'),
    HH = require('handlebars-helpers'),
    yaml = require('js-yaml'),
    YFM = require('yfm');

module.exports = taft;

function taft(file, options, data) {
    var t = new Taft(options, data);
    return t.build(file);
}

taft.Taft = Taft;

function Taft(options) {
    if (!(this instanceof Taft)) return new Taft(options);

    options = options || {};

    this.silent = options.silent || false;
    this.verbose = options.verbose || false;

    // data
    this._data = {};
    this.data(options.data || {});

    // helpers
    HH.register(Handlebars, {});
    this._knownHelpers = {};
    this.helpers(options.helpers || {});

    // partials
    this.partials(options.partials || []);

    // layout
    if (options.layout) this.layout(options.layout);
    
    return this;
}

Taft.prototype.layout = function(layout) {
    Handlebars.registerPartial('body', '');

    var _taft = new Taft().data(this._data);
    var _template = _taft.template(layout);

    this.debug('Using layout: ' + layout);

    this.applyLayout = function(content, pageData) {
        Handlebars.registerPartial('body', content);

        try {
            // override passed pageData with global data,
            // then append it in a page key
            var data = extend(clone(pageData), this._data, {page: pageData}),
                page = _template(data);

            Handlebars.registerPartial('body', '');

            return page;

        } catch (e) {
            throw('Unable to render page: ' + e.message);
        }
    };
    return this;
};

Taft.prototype.template = function(file) {
    var raw;

    try {
        raw = fs.readFileSync(file, {encoding: 'utf8'});
    } catch (err) {
        if (err.code == 'ENOENT') raw = file;
        else throw(err);
    }

    var source = YFM(raw);

    // class data extended by current context
    var data = extend(source.context, this._data),
        _data = function() { return clone(data); };

    var compile = Handlebars.compile(source.content.trimLeft(), {knownHelpers: this._helpers});

    var _template = function(data) {
        return compile(extend(_data(), data || {}));
    };

    _template.data = _data;

    return _template;
};

/*  
    Takes a mixed list of (1) files, (2) js objects, (3) JSON, (4) YAML
*/
Taft.prototype.data = function() {
    var args = Array.prototype.concat.apply([], Array.prototype.slice.call(arguments));

    var parseExtend = function(argument){
        var r = this._parseData(argument);
        extend(this._data, r);
    };

    args.forEach(parseExtend.bind(this));

    return this;
};

Taft.prototype._parseData = function(source, base) {
    var sink, result = {};

    if (typeof(source) === 'string') { source = source.trim(); }

    try {
        if (typeof(source) === 'object')
            sink = source;

        else if (source.substr(0, 3) === '---')
            sink = yaml.safeLoad(source);

        else if (source.slice(0, 1) == '{' && source.slice(-1) == '}')
            sink = JSON.parse(source);

        else
            throw "Didn't recognize format";

    } catch (e) {
        this.debug('Reading ' + source + ' as a file');
        sink = this.readFile(source);
    }


    return result;
};

Taft.prototype.readFile = function(filename) {
    var formats = ['.json', '.yaml'];
    var result = {};

    try {
        if (formats.indexOf(path.extname(filename)) < 0)
            throw "Didn't recognize file type.";

        var data = fs.readFileSync(filename, {encoding: 'utf8'});

        var base = path.basename(filename, path.extname(filename));

        result = this._parseData(data, base);

    } catch (err) {
        result = {};

        if (err.code == 'ENOENT') this.stderr("Couldn't find data file: " + filename);
        else this.stderr("Problem reading data file: " + filename);

        this.stderr(err);
    }

    return result;
};

Taft.prototype.build = function(file, data) {
    this.stderr('taft building ' + file);

    var template = this.template(file);
    var content = template(data);

    if (this.applyLayout)
        return this.applyLayout(content, extend(template.data(), data || {}));
    else
        return content;
};

Taft.prototype.helpers = function(helpers) {
    var registered = [];

    if (Array.isArray(helpers))
        registered = this.registerHelperFiles(helpers);

    else if (typeof(helpers) == 'object') {
        Handlebars.registerHelper(helpers);
        registered = Object.keys(helpers);
    }

    else if (typeof(helpers) == 'undefined') {}

    else
        this.stderr('Ignoring passed helpers because they were a ' + typeof(helpers) + '. Expected Array or Object.');

    if (registered.length) this.debug('registered helpers: ' + registered.join(', '));

    this._knownHelpers = Array.prototype.concat.apply(this._knownHelpers, registered);

    return this;
};

Taft.prototype.registerHelperFiles = function(helpers) {
    var registered = [];

    helpers.forEach((function(h){
        try {
            var module = require('./' + h);

            if (typeof(module) === 'function') {
                var name = path.basename(h, path.extname(h));
                Handlebars.registerHelper(name, module);
                registered = registered.concat(name);
            }

            else if (typeof(module) === 'object') {
                Handlebars.registerHelper(module);
                registered = Array.prototype.concat.apply(registered, Object.keys(module));
            }

            else
                throw "not a function or object.";

        } catch (err) {
            this.stderr("Error registering helper '" + h + "'");
            this.stderr(err);
        }

    }).bind(this));

    return registered;
};

Taft.prototype.partials = function(partials) {
    if (typeof(partials) == 'string') partials = [partials];

    var registered = [];

    if (Array.isArray(partials))
        for (var i = 0, len = partials.length, p; i < len; i++){
            p = path.basename(partials[i], path.extname(partials[i]));
            try {
                Handlebars.registerPartial(p, fs.readFileSync(partials[i], {encoding: 'utf-8'}));
                registered.push(p);
            } catch (err) {
                this.stderr("Could not register partial: " + p);
            }
        }

    else if (typeof(partials) === 'object')
        for (var name in partials)
            if (partials.hasOwnProperty(name))
                Handlebars.registerPartial(name, partials[name]);

    if (registered.length) this.debug('registered partials: ' + registered.join(', '));

    return this;
};

Taft.prototype.stderr = function (err) {
    if (!this.silent) {
        err = err.hasOwnProperty('message') ? err.message : err;
        console.error(err);
    }
};

Taft.prototype.debug = function (msg) {
    if (this.verbose && !this.silent) console.error(msg);
};
