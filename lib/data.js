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

var
    fs = require('rw'),
    glob = require('glob'),
    path = require('path'),
    ini = require('ini'),
    yaml = require('js-yaml'),
    gm = require('gray-matter');

var STDIN_RE = /^(\w+:)?(\/dev\/stdin?|-)/,
    DATA_FORMATS = ['.json', '.yaml', '.yml', '.ini', '.html', '.handlebars', '.hbs'];

function basename(filename) {
    var ext = path.extname(filename);
    return path.basename(filename, ext);
}

/**
    * Given a file name like "foo:bar.html", return "foo".
    * @param {string} filename
    * @return {string} the prefix
*/
function getprefix(filename) {
    // check for colon, ignore if without
    var fragments = filename.split(':');
    if (fragments.length > 1) return fragments[0];
    else return '';
}

/**
 * Parse an string as yaml, ini or JSON
 * @param {string} input
 * @return {object} parsed result
*/
function parseObj(input) {
    var line = input.trim().slice(0, 1024).split(/\r?\n/).shift();

    if (line === '---')
        return yaml.safeLoad(input);

    else if (line.slice(0, 1) === ';' || line.match(/^[.+]$/) || line.match(/^\w+ ?=/))
        return ini.decode(input);

    else if (line.indexOf('{') > -1 || line.indexOf('[') > -1)
        try {
            return JSON.parse(input);    
        } catch(_) {
            // pass
        }

    return;
}

/**
 * Read a file, returning data parsed based on contents
 * @param {string} filename
 * @return {object} parsed data
 */
function readFile(filename) {
    var result = {},
        ext = path.extname(filename),
        base = path.basename(filename, ext);

    try {
        var source = fs.readFileSync(filename, 'utf8');

        if (ext === '.yaml' || ext === '.yml')
            result = yaml.safeLoad(source);

        else if (ext === '.json')
            result = JSON.parse(source);

        else if (ext === '.ini')
            result = ini.decode(source);

        // A little duck-typing here: anything else gets fed to gray-matter.
        else
            result = gm(source, {strict: true}).data;

    } catch (e) {
        // ignore directories
        if (e.code === 'EISDIR') return;

        else if (e.code === 'ENOENT') throw e;

        else throw {message: "Didn't recognize format of " + filename};
    }
    return result;
}

/**
 * Read a possibly-prefixed glob into an object
 * @param {string} pattern
 * @return {object} 
 */
function readGlob(pattern) {
    var output = {},
        prefix = getprefix(pattern);

    if (prefix) pattern = pattern.substr(prefix.length + 1);

    var files = glob.sync(pattern);

    if (files.length === 0)
        throw {message: 'Empty result from globbing ' + pattern};

    if (prefix)
        output[prefix] = files.map(readFile).filter(x => !!x);

    else
        files.reduce((o, f) => {
            var result = readFile(f);
            if (result) o[basename(f)] = result;
            return o;
        }, output);

    return output;
}

/*
 * Read content from stdin.
 * @param {string} source the possibly-prefixed stdin, e.g. witches:/dev/stdin
 * @return {object}
 */
function readStdin(source) {
    var output = {},
        prefix = getprefix(source),
        stdin = fs.readFileSync('/dev/stdin', {encoding: 'utf8'}),
        result = parseObj(stdin);

    if (prefix)
        output[prefix] = result;
    else
        output = result;

    return output;
}

/*
 * Parses string, file, or file glob
 * @param {string/Array/object} source the input string, file or glob.
 * @return {object} data
 */
module.exports.parse = function(source) {
    var output;

    // Accept objects
    if (typeof source === 'object') output = source;

    // Maybe it's a YAML/JSON/INI string
    else output = parseObj(source);

    if (typeof output === 'undefined')
        try {
            // Read from stdin
            if (source.match(STDIN_RE))
                output = readStdin(source);

            // Read from glob
            else if (source.indexOf('*') > -1 || source.indexOf('{') > -1 || source.indexOf('[') > -1)
                output = readGlob(source);

            // Read a file
            else {
                output = {};
                output[basename(source)] = readFile(source);
            }

        } catch (err) {
            output = {};
            console.error(err.message || err, source);
        }

    return output;
};
