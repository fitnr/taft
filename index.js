#!/usr/bin/env node

'use strict';

var fs = require('rw'),
    glob = require('glob'),
    path = require('path'),
    extend = require('extend'),
    clone = require('clone-object'),
    // HH = require('handlebars-helpers'),
    Template = require('./lib/template'),
    ini = require('ini'),
    yaml = require('js-yaml'),
    YFM = require('yfm');

var STDIN_RE = /^(\w+:)?(\/dev\/stdin?|-)/;
var DATA_FORMATS = ['.json', '.yaml', '.ini'];

module.exports.taft = taft;

function mergeGlob(list) {
    if (!Array.isArray(list)) list = [list];
    list = list.map(function(e) {
        var globbed;
        try {
            globbed = glob.sync(e);
        } catch (e) {
            globbed = [];
        }
        return globbed.length ? globbed : e;
    });
    list = Array.prototype.concat.apply([], list);

    return list.filter(function(e, pos) { return list.indexOf(e) === pos; });
}

function taft(file, options) {
    return new Taft(options).build(require('handlebars'), file);
}

module.exports.Taft = Taft;

function Taft(options) {
    if (!(this instanceof Taft)) return new Taft(options);

    this.Handlebars = options.handlebars || require('handlebars');

    this._options = options || {};

    this.silent = this._options.silent || false;
    this.verbose = this._options.verbose || false;

    // data
    this._data = {};
    this.data(this._options.data || []);

    // helpers
    // uncomment when HH 0.6.0 is out
    // HH.register(this.Handlebars, {});
    this._knownHelpers = [];
    this.helpers(this._options.helpers || {});

    // partials
    this.partials(this._options.partials || []);

    // templates
    this._templates = {};

    // layouts
    this._layouts = {};

    this.Handlebars.registerPartial('body', '');
    this.layouts(this._options.layouts || []);

    return this;
}

/* 
 * Layouts are just templates of a different name
*/
Taft.prototype.layouts = function(layouts) {
    if (typeof(layouts) === 'string')
        layouts = [layouts];

    layouts = mergeGlob(layouts);

    layouts.forEach((function(layout) {
        var name = path.basename(layout);
        this.debug('Adding layout ' + name);
        this._layouts[name] = this._createTemplate(layout);
    }).bind(this));

    // as a convenience, when there's only one layout, that will be the default
    if (Object.keys(this._layouts).length === 1)
        this.defaultLayout = Object.keys(this._layouts).pop();
    else if (this._options.defaultLayout)
        this.defaultLayout = this._options.defaultLayout;

    return this;
};

Taft.prototype._applyLayout = function(name, content, pageData) {
    this.Handlebars.registerPartial('body', content);

    try {
        // override passed pageData with global data
        // (because layout is 'closer' to core of things)
        // then append it in a page key
        pageData.page = clone(pageData);
        var page = this._layouts[name].build(this.Handlebars, pageData, {noOverride: true});
        this.Handlebars.registerPartial('body', '');

        return page;

    } catch (e) {
        this.Handlebars.registerPartial('body', '');
        this.stderr(e);

        throw 'Unable to render page: ' + e.message;
    }
};

/**
 * Taft._createTemplate(file, options) 
 * returns a template object named (path.resolve(file))
 */
Taft.prototype._createTemplate = function(file, options) {

    var source = YFM.read(file),
        context = source.context || {},
        content = source.content || '';

    var templateOptions = {
        data: extend(clone(this._data), context),
        helpers: this._helpers
    };

    // protect against infinite loops
    // if file is foo.hbs, layout can't be foo.hbs
    // if file is default.hbs, layout can't be default.hbs
    if (context.layout || this.defaultLayout)
        if ([this.defaultLayout, context.layout].indexOf(path.basename(file)) === -1)
            templateOptions.layout = context.layout || this.defaultLayout;

    // class data extended by current context
    return new Template(content.trimLeft(), templateOptions);
};

/**
 * Taft.template(file) 
 * Creates a template named (path.resolve(file))
 */
Taft.prototype.template = function(file) {
    this.debug('Parsing ' + file);
    this._templates[path.resolve(file)] = this._createTemplate(file);

    return this;
};

/*
    Takes a mixed list of (1) files, (2) js objects, (3) JSON, (4) YAML, (5) INI
*/
Taft.prototype.data = function() {
    var args = Array.prototype.concat.apply([], Array.prototype.slice.call(arguments));

    args = mergeGlob(args);

    var parseExtend = function(argument) {
        var r = this._parseData(argument);
        extend(this._data, r);
    };

    args.forEach(parseExtend.bind(this));

    return this;
};

/*
 * base and ext are used by readFile
 */
Taft.prototype._parseData = function(source, base, ext) {
    var sink, result = {};

    if (typeof(source) === 'object')
        sink = source;

    else if (typeof(source) === 'string') {
        source = source.trim();

        var line1 = source.slice(0, 1024).split(/\r?\n/).shift();

        try {
            if (ext === '.yaml' || line1 === '---')
                sink = yaml.safeLoad(source);

            else if (ext === '.json' || source.slice(-1) === '}' || source.slice(-1) === ']')
                sink = JSON.parse(source);

            else if (ext === '.ini' || line1.slice(0, 1) === ';' || line1.match(/^[.+]$/) || line1.match(/^\w+ ?=/))
                sink = ini.decode(source);

            else if (typeof(ext) === 'undefined')
                sink = this.readFile(source);

            else throw 1;

        } catch (e) {
            this.stdout("Didn't recognize format of " + source);
        }
    }

    if (base) result[base] = sink;
    else result = sink;

    return result;
};

Taft.prototype.readFile = function(filename) {
    var result = {},
        base;

    this.debug('Reading file ' + filename);

    try {
        var ext = path.extname(filename);

        if (filename.match(STDIN_RE)) {
            base = filename.split(':').shift();
            filename = '/dev/stdin';
        }
        else if (DATA_FORMATS.indexOf(ext) > -1)
            base = path.basename(filename, ext);

        else throw "Didn't recognize file type " + ext;

        var data = fs.readFileSync(filename, {encoding: 'utf8'});

        result = this._parseData(data, base, ext);

    } catch (err) {
        if (err.code == 'ENOENT') this.stderr("Couldn't find data file: " + filename);
        else this.stderr("Problem reading data file: " + filename);

        this.stderr(err);
    }

    return result;
};

Taft.prototype.build = function(file, data) {
    if (!this._templates[path.resolve(file)]) this.template(file);

    var tpl = this._templates[path.resolve(file)];

    // Ignore page when published === false
    if (tpl.data.published === false || tpl.data.published === 0) {
        this.debug('ignoring: ' + file);
        return;
    }

    this.stderr('building: ' + file);

    var content = tpl.build(this.Handlebars, data);

    if (this._layouts[tpl.layout])
        content = this._applyLayout(tpl.layout, content, extend(tpl.data, data));

    return content;
};

Taft.prototype.helpers = function(helpers) {
    var registered = [];

    if (typeof(helpers) === 'string') helpers = [helpers];

    if (Array.isArray(helpers))
        registered = this.registerHelperFiles(mergeGlob(helpers));

    else if (typeof(helpers) == 'object') {
        this.Handlebars.registerHelper(helpers);
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
    var current = Object.keys(this.Handlebars.helpers);

    helpers.forEach((function(h) {
        var module;
        try {
            // load the module
            try {
                module = require(path.join(process.cwd(), h));

            } catch (err) {
                if (err.code === 'MODULE_NOT_FOUND')
                    module = require(h);
            }

            // register the module one of a couple of ways
            if (module.register)
                module.register(this.Handlebars, this._options);

            else if (typeof(module) === 'function')
                module(this.Handlebars, this._options);

            else if (typeof(module) === 'object')
                this.Handlebars.registerHelper(module);

            else
                throw "not a function or object.";

        } catch (err) {
            this.stderr("Error registering helper '" + h + "'");
            this.stderr(err);
        }

    }).bind(this));

    // return new helpers
    return Object.keys(this.Handlebars.helpers).filter(function(e) {
        return current.indexOf(e) === -1;
    });
};

Taft.prototype.partials = function(partials) {
    if (typeof(partials) == 'string') partials = [partials];

    var registered = [];

    if (Array.isArray(partials)) {
        partials = mergeGlob(partials);

        partials.forEach((function(partial) {
            var p = path.basename(partial, path.extname(partial));
            try {
                this.Handlebars.registerPartial(p, fs.readFileSync(partial, {encoding: 'utf-8'}));
                registered.push(p);
            } catch (err) {
                this.stderr("Could not register partial: " + p);
            }
        }).bind(this));

    } else if (typeof(partials) === 'object')
        for (var name in partials)
            if (partials.hasOwnProperty(name))
                this.Handlebars.registerPartial(name, partials[name]);

    if (registered.length) this.debug('registered partials: ' + registered.join(', '));

    return this;
};

Taft.prototype.stderr = function(err) {
    if (!this.silent) {
        err = err.hasOwnProperty('message') ? err.message : err;
        console.error(err);
    }
};

Taft.prototype.debug = function(msg) {
    if (this.verbose && !this.silent) console.error(msg);
};