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

function getprefix(filename) {
    // check for colon, ignore if without
    var fragments = filename.split(':');
    if (fragments.length > 1) return fragments[0];
    else return '';
}

function parseObj(input) {
    var line = input.trim().slice(0, 1024).split(/\r?\n/).shift();

    if (line === '---')
        return yaml.safeLoad(input);

    else if (line.slice(0, 1) === ';' || line.match(/^[.+]$/) || line.match(/^\w+ ?=/))
        return ini.decode(input);

    else
        try {
            return JSON.parse(input);

        } catch (err) {
            // pass
        }

    return {};
}

function readFile(filename) {
    var result = {},
        ext = path.extname(filename),
        base = path.basename(filename, ext),
        source = fs.readFileSync(filename, 'utf8');

    try {
        if (['.html', '.handlebars', '.hbs', '.shtml'].indexOf(ext) > -1)
            result = gm(source).data;

        else if (ext === '.yaml' || ext === '.yml')
            result = yaml.safeLoad(source);

        else if (ext === '.json')
            result = JSON.parse(source);

        else if (ext === '.ini')
            result = ini.decode(source);

        else throw new Error('unknown format: ' + ext);

    } catch (e) {
        console.error("Didn't recognize format of " + filename);
        throw e;
    }
    return result;
}

function readGlob(pattern) {
    var output = {},
        prefix = getprefix(pattern);
    if (prefix) pattern = pattern.substr(prefix.length + 1);

    var files = glob.sync(pattern);

    if (files.length === 0)
        throw {message: 'this is not a glob'};

    if (prefix)
        output[prefix] = files.map(function(f) {
            return readFile(f);
        });
    else
        files.reduce(function(o, f) {
            o[basename(f)] = readFile(f);
            return o;
        }, output);

    return output;
}

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
 */
module.exports.parse = function(source) {
    var output = {};

    // Accept objects
    if (typeof(source) === 'object')
        output = source;

    else
        try {
            // Read from stdin
            if (source.match(STDIN_RE))
                output = readStdin(source);

            // Read from glob
            else if (source.indexOf('*') > -1 || source.indexOf('{') > -1 || source.indexOf('[') > -1)
                output = readGlob(source);

            // Read a file
            else
                output[basename(source)] = readFile(source);

        } catch (err) {
            // assume it's a string in YAML/JSON/INI formats
            output = parseObj(source);
        }

    return output;
};
