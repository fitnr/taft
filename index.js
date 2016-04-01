#!/usr/bin/env node
'use strict';

var fs = require('rw'),
    path = require('path'),
    merge = require('merge'),
    mergeGlob = require('./lib/merge-glob'),
    Content = require('./lib/content'),
    Data = require('./lib/data'),
    gm = require('gray-matter');

function taft(file, options) {
    return new Taft(options)
        .build(file).toString();
}

module.exports = Taft;
module.exports.taft = taft;

/**
 * The Taft object reads layouts, partials and helpers, and then builds files.
 * @constructor
 * @this {Taft}
 * @param {object} options
 */
function Taft(options) {
    if (!(this instanceof Taft)) return new Taft(options || {});

    this._options = options || {};

    this.Handlebars = options.handlebars || require('handlebars');

    this.silent = options.silent || false;
    this.verbose = options.verbose || false;

    // initialize "private" globals
    this._data = {};
    this._helpers = [];
    this._layouts = new Map();

    return this
        .data(options.data || [])
        .helpers(options.helpers || {})
        .partials(options.partials || [])
        .layouts(options.layouts || []);
}

/**
 * Layouts are just templates of a different name
 * @return {Set/Taft} if passed without arguments, returns a
                      Set of layout names. Otherwise, returns this
 */
Taft.prototype.layouts = function() {
    if (arguments.length === 0) return new Set(this._layouts.keys());

    var layouts = flatten(arguments);

    // populate this._layouts Map
    mergeGlob(layouts).forEach(item =>
        this._layouts.set(path.basename(item), item));

    this.debug('added layouts: ' + Array.from(this._layouts.keys()).join(', '));

    // as a convenience, when there's only one layout, that will be the default
    if (this._layouts.size === 1)
        this._defaultLayout = path.basename(Array.from(this._layouts)[0][0]);

    else if (this._options.defaultLayout)
        this._defaultLayout = path.basename(this._options.defaultLayout);

    if (this._defaultLayout)
        this.debug('set default layout to ' + this._defaultLayout);

    return this;
};

/**
 * Set or get the default layout
 */
Taft.prototype.defaultLayout = function(layout) {
    if (typeof layout === 'undefined') return this._defaultLayout;

    layout = path.basename(layout);

    if (this.layouts().has(layout))
        this._defaultLayout = layout;
    else
        this.stderr('Not setting default layout. Could not find: ' + layout);

    return this;
};

/**
 * Taft._getLayout(name)
 * @param {string} name Layout to get.
 * @return {Content} layout with the given name, creating the template if needed
 */
Taft.prototype._getLayout = function(name) {
    if (!this._layouts.has(name)) {
        // if layout not registered, bail
        this.stderr('could not find layout : "' + name + '"');
        return;
    }

    var layout = this._layouts.get(name);

    if (typeof layout === 'string') {
        layout = this._createTemplate(layout);
        this._layouts.set(name, layout);
    }

    return layout
}

/**
 * Taft._applyLayout(layout, content)
 * Get a layout and register 'content' as the {{>body}} partial
 * @param {string} layout Name of layout
 * @param {Content} content Content object to apply layout to.
 * @returns {Content} the built result, with an option recursive call to layout.layout
 */
Taft.prototype._applyLayout = function(layout, content) {
    if (typeof layout === 'undefined') return content;

    try {
        var layout_template = this._getLayout(layout);

        if (!layout_template) return content;

        this.Handlebars.registerPartial('body', content.toString());

        content.data.page = merge.clone(content.data);

        // "prefer_global": passed pageData is overridden by
        // global data, because layout is 'closer' to core of things
        // and we also have the page key handy
        return layout_template(content.data, true);

    } catch (e) {
        throw new Error('unable to render layout ' + layout + ' ('+ e.message + ')');

    } finally {
        this.Handlebars.unregisterPartial('body');
    }
};

/**
 * @param {string} file
 * @param {object} options
 * @returns {object} a template object named (path.resolve(file))
 */
Taft.prototype._createTemplate = function(file, options) {
    var source = gm.read(file),
        context = source.data || {},
        page = (source.content || '').trimLeft();

    if (context.published === false || context.published === 0) return;

    // Assign layout:
    // If yaml front matter has layout==null or layout==false, don't assign a layout
    if (context.layout === false || context.layout === 0)
        this.debug('not using layout with ' + file);

    else if (!context.layout && this._defaultLayout)
        context.layout = this._defaultLayout;

    // protect against infinite loops
    // if file is foo.hbs, layout can't be foo.hbs
    if (context.layout === path.basename(file))
        context.layout = undefined;

    var data = merge(true, this._data, context);

    // anonymous function is basically a Handlebars template function, with a few spicy pickles added
    return (function(pageData, prefer_global) {
        var tplData = (prefer_global) ? merge(pageData, data) : merge(true, data, pageData);
        var build = this.Handlebars.compile(page, {knownHelpers: this._helpers});
        var compiled = build(tplData);
        return this._applyLayout(tplData.layout, new Content(compiled, tplData));
    }).bind(this);
};

/*
 *  Takes a mixed list of files, globs, js objects, JSON, YAML, INI
 *  globs may optionally be prefixed (prefix:data/*.yaml) to direct the data into a so-named Array
 *  The pseudo-file /dev/stdin may also be prefixed to place it into an object
 *  @return {mixed} if passed with arguments, returns this. If passed without arguments, returns data.
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

    flatten(arguments).forEach(parseExtend, this);

    return this;
};

Taft.prototype.build = function(file, data) {
    var content;

    try {
        var template = this._createTemplate(path.resolve(file));

        // Ignore page when published === false
        if (!template) {
            this.debug('ignoring ' + file);
            return;
        }

        this.stderr('building: ' + file);

        content = template(data);

        content.source = file;

    } catch (err) {
        this.stderr('error building ' + file + ': ' + err.message);
        content = new Content();
    }

    return content;
};

Taft.prototype.helpers = function() {
    if (arguments.length === 0) return Object.keys(this.Handlebars.helpers);

    var helpers = flatten(arguments);
    var current = new Set(Object.keys(this.Handlebars.helpers));

    mergeGlob(helpers).forEach(h => {
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
                        
                        if (Object.keys(this.Handlebars.helpers).length === current.size)
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
    });

    // return new helpers
    var registered = Object.keys(this.Handlebars.helpers).filter(e => !current.has(e));

    if (registered.length) this.debug('registered helpers: ' + registered.join(', '));

    this._helpers = this._helpers.concat(registered);

    return this;
};

Taft.prototype.partials = function() {
    if (arguments.length === 0) return Object.keys(this.Handlebars.partials);

    var partials = flatten(arguments);
    var registered = [];

    mergeGlob(partials).forEach(partial => {
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

    });

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

var flatten = function(args) {
    return [].concat.apply([], [].slice.call(args));
};
