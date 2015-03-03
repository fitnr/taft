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
    .description('Render a file with Handlebars')
    .option('-t, --layout <file>', 'layout (template) file', String)
    .option('-h, --helper <file>', 'Javascript file with handlebars helpers', String)
    .option('-p, --partials <file/pattern>', 'Partials', String)
    .option('-d, --data <data>', 'JSON or YAML data.', String)
    .option('-o, --output <path>', 'output file', String, '-')
    .option('-e, --ext <string>', 'output file extension', String, 'html')
    .option('-D, --dest-dir <path>', 'output directory (mandatory if more than one file given)', String, '.')
    
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
    else if (data.slice(-3) === '---' || data.slice(-4).toLowerCase() === 'yaml') {
        yaml = require('js-yaml');
        result = yaml.safeLoad(data);
    }

    // read json
    else if (data.slice(-4).toLowerCase() === 'json')
        fs.readFile(data, function(err, contents){
            if (err) process.stderr.write("Couldn't read data file");
            result = JSON.parse(contents);
        });

    else if (data.slice(0, 1) == '{' && data.slice(-1) == '}')
        result = JSON.parse(data);

    return result;
}

function outFile(outpath, file, ext) {
    return path.join(outpath, path.basename(file, path.extname(file)) + '.' + ext);
}

// expand files
var files = [];
for (var i = 0, len = program.args.length; i < len; i++) {
    if (program.args[i] === '-')
        file.push('-');
    else 
        Array.prototype.push.apply(files, glob.sync(program.args[i], {nonull: true}));
}

// check arguments
var err = '', warn = '';
if (files.length == 0)
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
        raise('not a directory');
} catch (e) {
    err += 'error - output directory not found\n';
}

if (err || warn) {
    process.stderr.write(err || warn);
    if (err)
        process.exit(1);
}

//setup options
var data = parseData(program.data),
    options = {
        layout: program.layout || undefined,
        partials: program.partials ? glob.sync(program.partials) : undefined
    };
    
if (program.helper)
    options.helpers = require(path.join(process.cwd(), program.helper));

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
var taft = new Taft(data, options);

if (program.output === '-')
    try {
        process.stdout.write(taft.eat(files[0]));
    } catch (e) {
        if (e.message === 'path must be a string')
            process.stderr.write('Error reading input')
        else
            process.stderr.write(e)
        process.exit(1);
    }

else for (var i = 0, len = files.length, f, output; i < len; i++) {
    f = outFile(program.destDir, files[i], program.ext);

    output = taft.eat(files[i]);

    fs.writeFile(f, output, function(err) {
        if (err) process.stderr.write(err);
    });
}
