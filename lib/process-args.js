#!/usr/bin/env node

'use strict';

var glob = require('glob'),
    parser = require('./parser');

var STDIN_RE = /^\w+:(\/dev\/stdin|-)/;

module.exports.process = function(program, callback) {

    var files = [];

    program.args.forEach(function(arg) {
        
        if (arg === '-') files.push('-');
        else Array.prototype.push.apply(files, glob.sync(arg, {nonull: true}));
    });

    // check arguments
    var err = '', warn = '';

    if (files.length === 0)
        err += 'error - please provide an input file\n';

    // Lists of files SHOULD have a dest dir
    if (files.length > 1 && !program.destDir)
            warn += 'warning - Writing multiple files without --dest-dir\n';

    // If STDIN is given, it MUST NOT also be given in data
    if (files.indexOf('-') > -1 || files.indexOf('/dev/stdin') > -1) {

        if (
            program.data.indexOf('-') > -1 || program.data.indexOf('/dev/stdin') > -1 ||
            program.data.some(function(x){ return String(x).match(STDIN_RE); })
        ) {
            err += "error - can't read from stdin twice";
        }

        files[files.indexOf('-')] = "/dev/stdin";
    }

    if (files.indexOf('-') > -1 && files.length > 1)
        warn += 'warning - using STDIN with named files is silly.';

    callback(err, warn, files);
};

module.exports.prefix = function(datafiles) {
    /*
        Handle files with a key prefix.
        e.g "foobar:data/foo.yaml"
            "bar:data/*.yaml"
    */
    return datafiles.map(function(d) {
        // check for colon, ignore if without

        var idx = d.indexOf(':');
        if (idx > -1)
            try {
                var key = d.substr(0, idx),
                    filename = d.substr(idx + 1),
                    files = glob.sync(filename);

                // WHen glob comes up empty, it's probably JSON
                if (files.length === 0)
                    return d;

                else {
                    d = {};
                    d[key] = files.map(function(x){ return parser.parse(':' + x); });
                }

            } catch (e) { /* pass */ }

        return d;
    });    
};
