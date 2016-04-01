#!/usr/bin/env node

'use strict';

var glob = require('glob');

var STDIN_RE = /^\w+:(\/dev\/stdin|-)/;

/**
 * Checks if file names passed to Taft command line are valid
 * @param {object} Commander-produced program instance
 * @param {function} callback function to run with valid file names.
 */
module.exports.args = function(program, callback) {
    var files = [];

    program.args.forEach(arg => {
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
