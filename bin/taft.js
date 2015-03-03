#!/usr/bin/env node

'use strict';

var path = require('path'),
    fs = require('fs'),
    concat = require('concat'),
    program = require('commander'),
    glob = require('glob'),
    Taft = require('..').Taft;

program
    .version('0.0.1')
    .usage('[options] <file ...>')
    .description('Render files with Handlebars')
    .option('-t, --layout <file>', 'layout (template) file', String)
    .option('-H, --helpers <file>', 'js file that exports an object containing handlebars helpers', String)
    .option('-p, --partials <file/pattern>', 'partials (basename of file is partial name)', String)
    .option('-d, --data <data>', 'JSON or YAML data.', String)
    .option('-o, --output <path>', 'output file', String, '-')
    .option('-D, --dest-dir <path>', 'output directory (mandatory if more than one file given)', String, '.')
    .option('-e, --ext <string>', 'output file extension (default: html)', String, 'html')
    .option('-v, --verbose', 'Output some debugging information')
    
    .parse(process.argv);

function parseData(data, noStdin) {
    var result;

    if (!data)
        result = {};

    else if (data === '-' && !noStdin)
        process.stdin.pipe(concat(function(data){
            result = parseData(data, true);
        }));

    // read yaml
    else if (data.substr(-3) === '---' || data.slice(-4).toLowerCase() === 'yaml') {
        var yaml = require('js-yaml');
        result = yaml.safeLoad(data);
    }

    // read json
    else if (data.substr(-4).toLowerCase() === 'json')
        try {
            result = fs.readFileSync(data, {encoding: 'utf8'});
        } catch(err) {
            if (err.code == 'ENOENT') console.error("Couldn't find data file: " + data);
            else console.error("Couldn't read data file: " + data);
        }

    else if (data.slice(0, 1) == '{' && data.slice(-1) == '}')
        result = JSON.parse(data);

    return result;
}

function outFile(outpath, file, ext) {
    return path.join(outpath, path.basename(file, path.extname(file)) + '.' + ext);
}

function logErr(err) {
    if (err) console.error(err);
}

// expand files
var files = [];
for (var i = 0, len = program.args.length; i < len; i++) {
    if (program.args[i] === '-')
        files.push('-');
    else 
        Array.prototype.push.apply(files, glob.sync(program.args[i], {nonull: true}));
}

// check arguments
var err = '', warn = '';
if (files.length === 0)
    err += 'error - please provide an input file\n';

if (files.indexOf('-') > -1) {
    if (files.length > 1) {
        warn += "warning - ignoring stdin because other files given";
        files.splice(files.indexOf('-'), 1);
    }

    if (program.data == '-')
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
var data = parseData(program.data),
    options = {
        layout: program.layout || undefined,
        partials: program.partials ? glob.sync(program.partials) : undefined,
        verbose: program.verbose || false
    };
    
if (program.helpers)
    options.helpers = require(path.join(process.cwd(), program.helpers));

if (program.ext.slice(0, 1) === '.')
    program.ext = program.ext.slice(1);

// read STDIN if necessary
if (files.indexOf('-') > -1) {
    var j = files.indexOf('-');
    
    process.stdin.pipe(concat(function(data){
        files[j] = data;
    }));
}

// render output
try {
    var taft = new Taft(options, data);

    if (program.output === '-')
        try {

            console.log(taft.eat(files[0]));

        } catch (e) {
            if (e.message === 'path must be a string')
                console.error('Error reading input');
            else
                console.error(e);
            process.exit(1);
        }

    else for (var i = 0, len = files.length, f, output; i < len; i++) {
        f = outFile(program.destDir, files[i], program.ext);

        output = taft.eat(files[i]);

        fs.writeFile(f, output, logErr);
    }

} catch(err) {

    console.error(err);

}
