#!/usr/bin/env node
/*
 * taft: generate files with Handlebars
 * Copyright (C) 2016 Neil Freeman

 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.

 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.

 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

/* jshint esversion: 6 */
'use strict';

const path = require('path'),
    fs = require('rw'),
    glob = require('glob'),
    merge = require('merge'),
    mkdirp = require('mkdirp'),
    program = require('commander');
 
const check = require('../lib/check'),
    Taft = require('..');

function collect(val, memo) {
    memo.push(val);
    return memo;
}

const license = `\n  copyright (C) 2016 Neil Freeman
  This program comes with ABSOLUTELY NO WARRANTY. This is free software,
  and you are welcome to redistribute it under certain conditions.`;

program
    .version('0.4.12')
    .usage('[options] <file ...>')
    .description('Render files with Handlebars\n' + license)
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
    .option('-s, --silent', "don't output progress information")
    .parse(process.argv);

function outFilePath(file) {
    if (program.destDir) {
        const outFile = (program.cwd) ? path.relative(program.cwd, file) : file;
        return path.join(program.destDir, outFile);

    } else {
        return program.output;
    }
}

function replaceExt(file, ext) {
    return file.slice(0, -path.extname(file).length) + '.' + ext;
}

function render(err, warn, files) {
    // process files and possibly toss errors
    if (err || warn) {
        console.error(err + warn);
        if (err) process.exit(1);
    }

    // use output extname if given
    program.ext = path.extname(program.output) || program.ext;

    // create TAFT global 
    // Two more keys, `output` & `file`, are added in the build step.
    const TAFT = {
        version: program.version(),
        cwd: program.cwd,
        destDir: program.destDir,
        // remove . from extension
        ext: (program.ext[0] === '.') ? program.ext.slice(1) : program.ext,
    };

    // render output
    const taft = new Taft(options);

    files.forEach(file => {
        TAFT.file = (program.cwd) ? path.relative(program.cwd, file) : file;
        TAFT.output = outFilePath(file);

        const build = taft.build(file, {'TAFT': TAFT});

        if (build) {
            const ext = (build.data.page || build.data || TAFT).ext || TAFT.ext,
                outfile = (TAFT.output === '/dev/stdout') ? TAFT.output : replaceExt(TAFT.output, ext);
            save(outfile, build.toString());
        }
    });
}

function save(file, content) {
    // Save files, create folders
    mkdirp(path.dirname(file), function(e) {

        if (e) return console.error(e);

        fs.writeFile(file, content, 'utf8', function(e) {
            if (e)
                console.error(e);
            else if (program.silent !== true && file !== '/dev/stdout')
                console.log(file);
        });
    });
}

// setup options
// include ENV variables in data
const options = {
    layouts: program.layout || undefined,
    partials: program.partial || undefined,
    data: program.data.concat({ENV: process.env}),
    helpers: program.helper || undefined,
    verbose: program.verbose || false,
    silent: program.silent || false,
    defaultLayout: program.defaultLayout || undefined,
};

// render files after checking quality of the args
check.args(program, render);
