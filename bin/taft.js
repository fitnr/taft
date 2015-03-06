#!/usr/bin/env node

'use strict';

var path = require('path'),
    rw = require('rw'),
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
    .version('0.0.2')
    .usage('[options] <file ...>')
    .description('Render files with Handlebars')
    .option('-t, --layout <file>', 'layout (template) file', String)
    .option('-H, --helper <file>', 'js file that exports an object containing handlebars helpers', mergeGlob, [])
    .option('-p, --partial <file>', 'partial (globs are ok)', mergeGlob, [])
    .option('-d, --data <data>', 'JSON or YAML data.', mergeGlob, [])
    .option('-o, --output <path>', 'output file', String, '-')
    .option('-D, --dest-dir <path>', 'output directory (mandatory if more than one file given)', String)
    .option('-e, --ext <string>', 'output file extension (default: html)', String, 'html')
    .option('-v, --verbose', 'Output some debugging information')
    .option('-s, --silent', "Don't output anything")
    .parse(process.argv);

function parseStdin(datasources) {
    return datasources.map(function(source) {
        if (source === '-' || source.match(STDIN_RE))
            source = source.slice(0, 1) + '/dev/stdin';

        return source;
    });
}

// expand files
var files = [];
program.args.forEach(function(arg) {
    if (arg === '-') files.push('-');
    else Array.prototype.push.apply(files, glob.sync(arg, {nonull: true}));
});

// check arguments
var err = '', warn = '';

if (files.length === 0) {
    err += 'error - please provide an input file\n';
}

// Lists of files SHOULD have a dest dir
if (files.length > 1 && !program.destDir)
        warn += 'warning - Writing multiple files without --dest-dir\n';

// If STDIN is given, it MUST not also be given in data
if (files.indexOf('-') > -1) {
    if (
        program.data.indexOf('-') > -1 ||
        program.data.some(function(x){ return String(x).match(STDIN_RE); })
    ) {
        err += "error - can't read from stdin twice";
    }

    files[files.indexOf('-')] = "/dev/stdin";
}

if (err || warn) {
    console.error(err + warn);
    if (err) process.exit(1);
}

// handle stdout
if (program.output === '-') program.output = '/dev/stdout';

// remove . from extension
var ext = (program.ext.slice(0, 1) === '.') ? program.ext.slice(1) : program.ext;

function outFilePath(file) {
    if (program.destDir)
        return path.join(program.destDir, path.basename(file, path.extname(file)) + '.' + ext);

    else return program.output;
}

// setup options
var options = {
        layouts: program.layout || undefined,
        partials: program.partial ? mergeGlob(program.partial) : undefined,
        data: parseStdin(program.data),
        helpers: program.helper || undefined,
        verbose: program.verbose || false,
        silent: program.silent || false,
    };

// render output
var taft = new Taft(options);

files.forEach(function(file) {
    var f = outFilePath(file);

    if (!program.silent && program.output !== '/dev/stdout')
        console.log(f);

    rw.writeFileSync(f, taft.build(file), {encoding:'utf8'}, function(err) {
        if (err) console.error(err);
    });
});
