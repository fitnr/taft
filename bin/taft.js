#!/usr/bin/env node

'use strict';

var path = require('path'),
    fs = require('fs'),
    concat = require('concat-stream'),
    program = require('commander'),
    glob = require('glob'),
    extend = require('extend'),
    yaml = require('js-yaml'),
    Taft = require('..').Taft;

function mergeGlob(val, list) {
    var globbed = Array.isArray(val) ? val : glob.sync(val);
    globbed = globbed.length ? globbed : [val];
    list = Array.prototype.concat.apply(list || [], globbed);
    return list;
}

var STDIN_RE = /^\w+:-$/;

program
    .version('0.0.1')
    .usage('[options] <file ...>')
    .description('Render files with Handlebars')
    .option('-t, --layout <file>', 'layout (template) file', String)
    .option('-H, --helper <file>', 'js file that exports an object containing handlebars helpers', mergeGlob, [])
    .option('-p, --partial <file>', 'partial (globs are ok)', mergeGlob, [])
    .option('-d, --data <data>', 'JSON or YAML data.', mergeGlob, [])
    .option('-o, --output <path>', 'output file', String, '-')
    .option('-D, --dest-dir <path>', 'output directory (mandatory if more than one file given)', String, '.')
    .option('-e, --ext <string>', 'output file extension (default: html)', String, 'html')
    .option('-v, --verbose', 'Output some debugging information')
    .option('-s, --silent', "Don't output anything")
    .parse(process.argv);

function parseStdin(datasources) {
    return datasources.map(function(source) {
        if (source === '-' || source.match(STDIN_RE)) {
            var result = {},
                sink = source === '-' ? result : result[source.slice(0, -2)];

            process.stdin.pipe(concat(function(data) {
                sink = Taft.prototype.parseData(data);
            }));
            source = result;
        }
        return source;
    });
}

function outFile(outpath, file, ext) {
    return path.join(outpath, path.basename(file, path.extname(file)) + '.' + ext);
}

function logErr(err) {
    if (err) console.error(err);
}

// expand files
var files = [];
program.args.forEach(function(arg) {
    if (arg === '-') files.push('-');
    else Array.prototype.push.apply(files, glob.sync(arg, {nonull: true}));
});

// check arguments
var err = '', warn = '';
if (files.length === 0)
    err += 'error - please provide an input file\n';

if (files.indexOf('-') > -1) {
    if (files.length > 1) {
        warn += "warning - ignoring stdin because other files given";
        files.splice(files.indexOf('-'), 1);
    }

    var namedStdin = program.data.some(function(x){ return String(x).match(STDIN_RE); });

    if (program.data.indexOf('-') > -1 || namedStdin)
        err += "error - can't read from stdin twice";
}

try {
    if (!fs.lstatSync(program.destDir).isDirectory())
        throw 'not a directory';
} catch (e) {
    err += 'error - output directory not found\n';
}

if (err || warn) {
    console.error(err || warn);
    if (err)
        process.exit(1);
}

//setup options
var options = {
        layout: program.layout || undefined,
        partials: program.partial ? mergeGlob(program.partial) : undefined,
        data: parseStdin(program.data),
        helpers: program.helper || undefined,
        verbose: program.verbose || false,
        silent: program.silent || false,
    };

var ext = (program.ext.slice(0, 1) === '.') ? program.ext.slice(1) : program.ext;

// read STDIN if necessary
if (files.indexOf('-') > -1) {
    var j = files.indexOf('-');

    process.stdin.pipe(concat(function(data){
        files[j] = data;
    }));
}

var taft = new Taft(options);

// render output
try {
    if (program.output === '-')
        try {
            console.log(taft.build(files[0]));

        } catch (e) {
            if (e.message === 'path must be a string')
                console.error('Error reading input');
            else
                console.error(e);

            process.exit(1);
        }

    else
        files.forEach(function(file) {
            var f = outFile(program.destDir, file, ext);

            if (!program.silent) console.log(f);

            fs.writeFile(f, taft.build(file), logErr);
        });

} catch(err) {
    taft.stderr(err);
}
