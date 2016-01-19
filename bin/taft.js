#!/usr/bin/env node

'use strict';

var path = require('path'),
    fs = require('rw'),
    glob = require('glob'),
    merge = require('merge'),
    mkdirp = require('mkdirp'),
    program = require('commander');
 
var check = require('../lib/check'),
    Taft = require('..');

function collect(val, memo) {
  memo.push(val);
  return memo;
}

program
    .version('0.2.2')
    .usage('[options] <file ...>')
    .description('Render files with Handlebars')
    .option('-H, --helper <file>', 'js file that exports an object containing handlebars helpers', collect, [])
    .option('-p, --partial <file>', 'Handlebars partial', collect, [])
    .option('-d, --data <data>', 'JSON, YAML or INI file or data (stdin with \'-\' or \'key:-\')', collect, [])
    .option('-t, --layout <file>', 'Handlebars template file', collect, [])
    .option('-y, --default-layout <name>', 'use this layout as default', String)
    .option('-o, --output <path>', 'output path', String, '/dev/stdout')
    .option('-D, --dest-dir <path>', 'output directory (mandatory if more than one file given)', String)
    .option('-C, --cwd <path>', 'save files relative this directory', String)
    .option('-e, --ext <string>', 'output file extension (default: html)', String, 'html')
    .option('-v, --verbose', 'output some debugging information')
    .option('-s, --silent', "don't output anything")
    .parse(process.argv);

function outFilePath(file) {
    if (program.destDir) {
        if (program.cwd)
            file = path.relative(program.cwd, file);

        return path.join(program.destDir, file);

    } else {
        return program.output;
    }
}

function replaceExt(file, ext) {
    return file.slice(0, -path.extname(file).length) + '.' + ext;
}

// setup options
var options = {
    layouts: program.layout || undefined,
    partials: program.partial || undefined,
    data: program.data || undefined,
    helpers: program.helper || undefined,
    verbose: program.verbose || false,
    silent: program.silent || false,
    defaultLayout: program.defaultLayout || undefined,
};

// process files and possibly toss errors
check.args(program, function(err, warn, files) {
    if (err || warn) {
        console.error(err + warn);
        if (err) process.exit(1);
    }

    // use output extname if given
    program.ext = path.extname(program.output) || program.ext;

    // remove . from extension
    var ext = (program.ext.slice(0, 1) === '.') ? program.ext.slice(1) : program.ext;

    // render output
    var taft = new Taft(options);

    files.forEach(function(file) {
        var outfile = outFilePath(file),
            build = taft.build(file);

        if (build) {
            outfile = (outfile === '/dev/stdout') ? outfile : replaceExt(outfile, build.ext || ext);

            save(outfile, build.toString());
        }
    });
});

function save(file, content) {
    mkdirp(path.dirname(file), function(e) {

        if (e) return console.error(e);

        fs.writeFile(file, content, 'utf8', function(e) {

            if (e) {
                console.error(e);
                return;
            }
            else if (program.silent !== true && file !== '/dev/stdout')
                console.log(file);

        });
    });
}
