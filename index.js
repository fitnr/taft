#!/usr/bin/env node
'use strict';

var fs = require('rw'),
    path = require('path'),
    merge = require('merge'),
    mergeGlob = require('./lib/merge-glob'),
    Template = require('./lib/template'),
    Data = require('./lib/data'),
    gm = require('gray-matter');

function taft(file, options) {
    return new Taft(options)
        .build(file).toString();
}

module.exports = Taft;
module.exports.taft = taft;

function Taft(options) {
    if (!(this instanceof Taft)) return new Taft(options || {});

    this._options = options || {};

    this.Handlebars = this._options.handlebars || require('handlebars');

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
Taft.prototype.layouts = function() {
    if (arguments.length === 0) return Object.keys(this._layouts);

    var layouts = Array.prototype.concat.apply([], Array.prototype.slice.call(arguments));

    mergeGlob(layouts).forEach((function(layout) {
    mergeGlob(layouts).forEach(function(layout) {
        var name = path.basename(layout);
        this.debug('adding layout ' + name);
        this._layouts[name] = this._createTemplate(layout);
    }, this);

    // as a convenience, when there's only one layout, that will be the default
    if (Object.keys(this._layouts).length === 1)
        this._defaultLayout = path.basename(Object.keys(this._layouts).pop());
    else if (this._options.defaultLayout)
        this._defaultLayout = path.basename(this._options.defaultLayout);

    if (this._defaultLayout)
        this.debug('set default layout to ' + this._defaultLayout);

    return this;
};

Taft.prototype._applyLayout = function(name, content, pageData) {
    this.Handlebars.registerPartial('body', content);

    try {
        // override passed pageData with global data
        // (because layout is 'closer' to core of things)
        // then append it in a page key
        pageData.page = merge.clone(pageData);

        var page = this._layouts[name].build(this.Handlebars, pageData, {noOverride: true});

        if (this._layouts[name].layout)
            page = this._applyLayout(this._layouts[name].layout, page.toString(), pageData);

        return page;

    } catch (e) {
        this.debug(e);
        throw new Error('unable to render page: ' + e.message);

    } finally {
        this.Handlebars.unregisterPartial('body');
    }
};

/**
 * Taft._createTemplate(file, options) 
 * returns a template object named (path.resolve(file))
 */
Taft.prototype._createTemplate = function(file, options) {
    var source = gm.read(file),
        context = source.data || {},
        content = source.content || '';

    var templateOptions = {
        data: merge(true, this._data, context),
        helpers: this._helpers
    };

    // If yaml front matter has layout: null or layout: false, don't assign a layout
    if (context.hasOwnProperty('layout') && !context.layout)
        this.debug('not using layout');
    else
        templateOptions.layout = context.layout || this._defaultLayout;

    // protect against infinite loops
    // if file is foo.hbs, layout can't be foo.hbs
    // if file is default.hbs, layout can't be default.hbs
    if (templateOptions.layout === path.basename(file)) {
        delete templateOptions.layout;
        this.debug("ignoring layout for " + file + ", since it seems to be itself");
    }

    // class data extended by current context
    return new Template(content.trimLeft(), templateOptions);
};

/**
 * Taft.template(file) 
 * Creates a template named (path.resolve(file))
 */
Taft.prototype.template = function(file) {
    this.debug('parsing ' + file);
    this._templates[path.resolve(file)] = this._createTemplate(file);

    return this;
};

Taft.prototype.defaultLayout = function(layout) {

    if (layout === undefined) return this._defaultLayout;

    if (this._layouts[path.basename(layout)])
        this._defaultLayout = layout;
    else
        this.stderr('Not setting layout. Could not find: '+ layout);

    return this;
};

/*
    Takes a mixed list of files, globs, js objects, JSON, YAML, INI
    globs may optionally be prefixed (prefix:data/*.yaml) to direct the data into a so-named Array
    The pseudo-file /dev/stdin may also be prefixed to place it into an object
*/
Taft.prototype.data = function() {
    if (arguments.length === 0) return this._data;

    // argument may be a file, a glob, or an object
    var parseExtend = function(argument) {
        var r = Data.parse(argument);
        var keys = Object.keys(r);

        if (keys.length === 0)
            this.stderr("could not read any data from " + argument);
        else if (keys.length === 1)
            this.debug("parsed " + keys[0]);
        else
            this.debug("parsed an object");

        merge(this._data, r);
    };

    Array.prototype.concat.apply([], Array.prototype.slice.call(arguments))
        .forEach(parseExtend, this);

    return this;
};

Taft.prototype.build = function(file, data) {
    if (!this._templates[path.resolve(file)]) this.template(file);

    var tpl = this._templates[path.resolve(file)];

    // Ignore page when published === false
    if (tpl.data.published === false || tpl.data.published === 0) {
        this.debug('ignoring ' + file);
        return;
    }

    this.stderr('building: ' + file);
    if (tpl.layout) this.debug('layout: ' + tpl.layout);

    var content = tpl.build(this.Handlebars, data);

    if (this._layouts[tpl.layout])
        content = this._applyLayout(tpl.layout, content.toString(), merge(tpl.data, data));

    // optionally add extension
    if (tpl.data.ext)
        content.ext = tpl.data.ext;

    content.source = file;

    return content;
};

Taft.prototype.helpers = function() {
    if (arguments.length === 0) return Object.keys(this.Handlebars.helpers);

    var helpers = Array.prototype.concat.apply([], Array.prototype.slice.call(arguments));
    var current = Object.keys(this.Handlebars.helpers);

    mergeGlob(helpers).forEach(function(h) {
        var module;

        try {
            if (typeof(h) === 'object') {
                this.Handlebars.registerHelper(h);

            } else if (typeof(h) === 'string') {

                // load the module
                try {
                    require.resolve(h);
                    module = require(h);
                } catch(err) {
                    if (err.code === 'MODULE_NOT_FOUND')
                        module = require(path.join(process.cwd(), h));
                }

                // register the module one of a couple of ways
                if (module.register)
                    try {
                        module.register(this.Handlebars, this._options, {});    
                    } catch (err) {
                        this.debug("register function err for " + h);
                    }

                else if (typeof(module) === 'function')
                    try {
                        this.Handlebars.registerHelper(module());
                        
                        if (Object.keys(this.Handlebars.helpers).length === current.length)
                            throw new Error("Registering by passing function in " + h + " didn't work. Trying another way");

                    } catch (err) {
                        module(this.Handlebars, this._options);
                    }

                else if (typeof(module) === 'object')
                    this.Handlebars.registerHelper(module);

                else
                    throw new Error("Didn't find a function or object in " + h);
            } else {
                this.stderr('Ignoring helper because it\'s a ' + typeof(h) + '. Expected an object or the name of a module');
            }

        } catch (err) {
            this.stderr("Error registering helper '" + h + "'");
            this.stderr(err);
        }
    }, this);

    // return new helpers
    var registered = Object.keys(this.Handlebars.helpers).filter(function(e) {
        return current.indexOf(e) === -1;
    });

    if (registered.length) this.debug('registered helpers: ' + registered.join(', '));

    this._knownHelpers = Array.prototype.concat.apply(this._knownHelpers, registered);

    return this;
};

Taft.prototype.partials = function() {
    if (arguments.length === 0) return Object.keys(this.Handlebars.partials);

    var partials = Array.prototype.concat.apply([], Array.prototype.slice.call(arguments));

    var registered = [];

    mergeGlob(partials).forEach(function(partial) {
        if (typeof(partial) === 'object') {

            for (var name in partial) {
                if (partial.hasOwnProperty(name)) {
                    this.Handlebars.registerPartial(name, partials[name]);
                    registered.push(name);
                }
            }

        } else {

            var p = path.basename(partial, path.extname(partial));

            try {
                this.Handlebars.registerPartial(p, fs.readFileSync(partial, 'utf8'));
                registered.push(p);
            } catch (err) {
                this.stderr("Could not register partial: " + p);
            }
        }

    }, this);

    if (registered.length) this.debug('registered partials: ' + registered.join(', '));

    return this;
};

Taft.prototype.stderr = function(err) {
    if (!this.silent) {
        err = typeof err === 'object' && 'message' in err ? err.message : err;
        console.error(err);
    }
};

Taft.prototype.debug = function(msg) {
    if (this.verbose && !this.silent) console.error(msg);
};