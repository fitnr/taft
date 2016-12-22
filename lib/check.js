#!/usr/bin/env node
/*
 * taft: generate files with Handlebars
 * Copyright (C) 2016 Neil Freeman

 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.

 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.

 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/
/* jshint esversion: 6 */
'use strict';

const glob = require('glob');
const STDIN_RE = /^\w+:(\/dev\/stdin|-)/;

/**
 * Checks if file names passed to Taft command line are valid
 * @param {object} Commander-produced program instance
 * @param {function} callback function to run with valid file names.
 */
module.exports.args = function(program, callback) {
    const err = [],
        warn = [],
        opts = {nonull: true, nodir: true};

    const files = Array.prototype.concat.apply([],
        program.args.map(arg => glob.sync(arg, opts))
    );

    if (program.destDir === (program.cwd || '.')) {
        err.push("error - ignoring --dest-dir, it might overwrite input files");
        program.destDir = undefined;
    }

    if (files.length === 0)
        err.push('error - please provide an input file');

    // Lists of files SHOULD have a dest dir
    if (files.length > 1 && !program.destDir)
        warn.push('warning - writing multiple files without --dest-dir');

    // If STDIN is given, it MUST NOT also be given in data
    if (files.indexOf('-') > -1 || files.indexOf('/dev/stdin') > -1) {
        if (
            program.data.indexOf('-') > -1 || program.data.indexOf('/dev/stdin') > -1 ||
            program.data.some(x => String(x).match(STDIN_RE))
        ) {
            err.push("error - can't read from STDIN twice");
        }

        files[files.indexOf('-')] = "/dev/stdin";
    }

    callback(err.join('\n'), warn.join('\n'), files);
};
