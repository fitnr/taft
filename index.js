'use strict';

var fs = require('fs'),
    path = require('path'),
    extend = require('extend'),
    Handlebars = require('handlebars'),
    YFM = require('yfm');

var taft = function(file, data, options) {
    if (typeof(options) === 'undefined') {
        options = data;
        data = {};
    }

    data = data || {};
    var rawfile;

    try {
        rawfile = fs.readFileSync(file, {encoding: 'utf8'});
    } catch (err) {
        if (err.name == 'TypeError') rawfile = file;
        else throw(err)
    }

    Handlebars.registerHelper(options.helpers || {});
    registerPartials(options.partials || []);

    var source = YFM(rawfile),
        format = Handlebars.compile(source.content.trimLeft()),
        content = format(extend(data, source.context));

    if (options.template)
        content = taft(options.template, {page: data}, {
            partials: {
                body: content
            }
        });

    return content;
}

taft.prototype.Taft = function(data, options) {
    this.data = data;
    this.options = options;

}

var registerPartials = function(partials) {
    if (Array.isArray(partials))
        for (var i = 0, len = partials.length, name; i < len; i++) {
            name = path.basename(items[i], path.extname(items[i]));

            try {
                Handlebars.registerPartial(name, fs.readFileSync(items[i]));
            } catch (err) {
                console.error("Could not register partial: " + name);
            }
        }

    else if (typeof(partials) === 'object')
        for (var name in partials)
            if (partials.hasOwnProperty(name))
                Handlebars.registerPartial(name, partials[name]);
};

module.exports = taft;
