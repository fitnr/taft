#!/usr/bin/env node

'use strict';

var path = require('path'),
    rw = require('rw'),
    mkdirp = require('mkdirp'),
    program = require('commander');
 
var processArgs = require('../lib/process-args.js'),
    Taft = require('..').Taft;

function collect(val, memo) {
  memo.push(val);
  return memo;
}

program
    .version('0.0.5')
    .usage('[options] <file ...>')
    .description('Render files with Handlebars')
    .option('-H, --helper <file>', 'js file that exports an object containing handlebars helpers', collect, [])
    .option('-p, --partial <file>', 'partial (globs are ok)', collect, [])
    .option('-d, --data <data>', 'JSON, YAML or INI file or data (stdin with \'-\' or \'key:-\')', collect, [])
    .option('-t, --layout <file>', 'layout (template) file', collect, [])
    .option('-y, --default-layout <name>', 'use this layout as default', String)
    .option('-o, --output <path>', 'output file', String, '/dev/stdout')
    .option('-D, --dest-dir <path>', 'output directory (mandatory if more than one file given)', String)
    .option('-C, --cwd <path>', 'Saves files relative this directory', String)
    .option('-e, --ext <string>', 'output file extension (default: html)', String, 'html')
    .option('-v, --verbose', 'Output some debugging information')
    .option('-s, --silent', "Don't output anything")
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

// Must be bound to {file: foo, build: build} object
function save(er) {
    /*jshint validthis:true */
    if (er) console.error(er);

    var file = this.file;

    rw.writeFile(file, this.content, 'utf8', function(err) {

        if (err) console.error(err);

        if (program.silent !== true && file !== '/dev/stdout')
            console.log(file);
    });
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
processArgs(program, function(err, warn, files) {
    if (err || warn) {
        console.error(err + warn);
        if (err) process.exit(1);
    }

    // remove . from extension
    var ext = (program.ext.slice(0, 1) === '.') ? program.ext.slice(1) : program.ext;

    // render output
    var taft = new Taft(options);

    files.forEach(function(file) {
        var outfile = outFilePath(file),
            build = taft.build(file);

        if (build) {
            outfile = (outfile === '/dev/stdout') ? outfile : replaceExt(outfile, build.ext || ext);

            mkdirp(path.dirname(outfile), save.bind({
                content: build.toString(),
                file: outfile
            }));
        }
    });

});
