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
    .option('-o, --output <path>', 'output file', String, '-')
    .option('-D, --dest-dir <path>', 'output directory (mandatory if more than one file given)', String)
    .option('-C, --cwd <path>', 'Saves files relative this directory', String)
    .option('-e, --ext <string>', 'output file extension (default: html)', String, 'html')
    .option('-v, --verbose', 'Output some debugging information')
    .option('-s, --silent', "Don't output anything")
    .parse(process.argv);

function outFilePath(file, ext) {
    if (program.destDir) {
        if (program.cwd)
            file = path.relative(program.cwd, file);
        
        var dirpart = path.dirname(file),
            base = path.basename(file, path.extname(file)) + '.' + ext;

        return path.join(program.destDir, dirpart, base);

    } else {
        return program.output;
    }
}

// Must be bound to {file: foo, build: build} object
function save(er) {
    /*jshint validthis:true */
    if (er) console.error(er);

    var file = this.file;

    rw.writeFile(file, this.build, {encoding: 'utf8'}, function(err) {
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

    // handle stdout
    if (program.output === '-')
        program.output = '/dev/stdout';

    // remove . from extension
    var ext = (program.ext.slice(0, 1) === '.') ? program.ext.slice(1) : program.ext;

    // render output
    var taft = new Taft(options);

    files.forEach(function(file) {
        var f = outFilePath(file, ext),
            build = taft.build(file);

        if (build)
            mkdirp(path.dirname(f), save.bind({build: build, file: f}));
    });

});
