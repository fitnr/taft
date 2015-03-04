#!/usr/bin/env node

'use strict';

var path = require('path'),
    fs = require('fs'),
    concat = require('concat'),
    program = require('commander'),
    glob = require('glob'),
    extend = require('extend'),
    yaml = require('js-yaml'),
    Taft = require('..').Taft;

function mergeGlob(val, list) {
    list = list || [];
    console.log(val, list);
    console.log(list.concat.apply(list, glob.sync(val)));
    console.log(list)
    return list.concat.apply(list, glob.sync(val));
}

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

function parseData(data, noStdin) {
    var result = {};

    if (data === '-' && !noStdin)
        process.stdin.pipe(concat(function(data){
            result = parseData(data, true);
        }));

    // read yaml
    else if (data.substr(0, 3) === '---')
        result = yaml.safeLoad(data);

    else if (data.slice(0, 1) == '{' && data.slice(-1) == '}')
        result = JSON.parse(data);

    return result;
}

function parseDataFiles(datafiles) {
    var result = {},
        formats = ['.json', '.yaml'];

    if (datafiles.indexOf('-') > -1) {
        datafiles.splice(datafiles.indexOf('-'));
        result = parseData('-');
    }

    for (var i = 0, raw, data, d, len = datafiles.length; i < len; i++) {
        d = datafiles[i];
        if (formats.indexOf(path.extname(d)) > -1) {

            try {
                raw = fs.readFileSync(d, {encoding: 'utf8'});
                result[path.basename(d, path.extname(d))] = parseData(raw, true);

            } catch (err) {
                if (!program.silent) {
                    if (err.code == 'ENOENT')
                        console.error("Couldn't find data file: " + err.path);
                    else
                        console.error("Problem read data file: " + d);
                }
            }

        } else {
            extend(result, parseData(datafiles[i], true));
        }
    }
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

    if (program.data.indexOf('-') > -1)
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
var data = parseDataFiles(program.data),
    options = {
        layout: program.layout || undefined,
        partials: program.partial ? mergeGlob(program.partial) : undefined,
        helpers: program.helper || undefined,
        verbose: program.verbose || false
    };

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

            console.log(taft.build(files[0]));

        } catch (e) {
            if (e.message === 'path must be a string')
                console.error('Error reading input');
            else
                console.error(e);
            process.exit(1);
        }

    else for (var i = 0, len = files.length, f, output; i < len; i++) {
        f = outFile(program.destDir, files[i], program.ext);

        if (!program.silent) console.log(f);

        output = taft.build(files[i]);

        fs.writeFile(f, output, logErr);
    }

} catch(err) {

    console.error(err);

}
