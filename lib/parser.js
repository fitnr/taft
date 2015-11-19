var
    fs = require('rw'),
    path = require('path'),
    ini = require('ini'),
    yaml = require('js-yaml'),
    YFM = require('yfm');

var STDIN_RE = /^(\w+:)?(\/dev\/stdin?|-)/,
    DATA_FORMATS = ['.json', '.yaml', '.yml', '.ini', '.html', '.handlebars', '.hbs'];

var readFile = function(filename, options) {
    var result = {},
        base;

    try {
        var ext = path.extname(filename),
            extpos = DATA_FORMATS.indexOf(ext);

        if (filename.indexOf(':') > -1) {
            base = filename.split(':').shift();

            if (filename.match(STDIN_RE))
                filename = '/dev/stdin';

            else if (extpos > -1)
                filename = filename.split(':').pop();
        }
        else if (extpos > -1)
            base = path.basename(filename, ext);

        else throw "Didn't recognize file type " + ext;

        var data = fs.readFileSync(filename, 'utf8');
        result = parse(data, base, ext);

    } catch (err) {
        if (err.code == 'ENOENT') console.error("Couldn't find data file: " + filename);
        else console.error("Problem reading data file: " + filename);

        console.error(err);
    }

    return result;
};

/*
 * Parses either string or file
 * base and ext are used by readFile
 */
var parse = function(source, base, ext) {
    var sink, result = {};

    if (typeof(source) === 'object')
        sink = source;

    else if (typeof(source) === 'string') {
        source = source.trim();

        var line1 = source.slice(0, 1024).split(/\r?\n/).shift();

        try {
            if (['.html', '.handlebars', '.hbs'].indexOf(ext) > -1 && line1 === '---')
                sink = YFM(source).context;

            else if (ext === '.yaml' || ext === '.yml' || line1 === '---')
                sink = yaml.safeLoad(source);

            else if (ext === '.json' || source.slice(-1) === '}' || source.slice(-1) === ']')
                sink = JSON.parse(source);

            else if (ext === '.ini' || line1.slice(0, 1) === ';' || line1.match(/^[.+]$/) || line1.match(/^\w+ ?=/))
                sink = ini.decode(source);

            else if (typeof(ext) === 'undefined')
                sink = readFile(source);

            else throw 1;

        } catch (e) {
            console.error("Didn't recognize format of " + source);
            console.error(e);
        }
    }

    if (base)
        result[base] = sink;
    else
        result = sink;

    return result;
};

module.exports.parse = parse;
