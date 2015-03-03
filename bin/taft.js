#!/usr/bin/env node

'use strict';

var path = require('path'),
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
    .option('-o, --output <path>', 'output path or directory (mandatory if more than one file given)', String, '-')
    .option('-e, --ext <string>', 'output file extension', String, 'html')
    .parse(process.argv);

function parseData(data, noStdin) {
    var result;
    if (!data)
        result = {};

    else if (data === '-' && !noStdin) {
        var stdin;

        process.stdin.setEncoding('utf8');
        process.stdin.on('readable', function() {
            var chunk = process.stdin.read();
            if (chunk !== null) stdin += chunk;
        });

        process.stdin.on('end', function() {
            // recurse!
            result = parseData(stdin, true);
        });
    }

    // read yaml
    else if (data.slice(-3) === '---' || data.slice(-4).toLowerCase() === 'yaml') {
        yaml = require('js-yaml');
        result = yaml.safeLoad(data);
    }

    // read json
    else if (data.slice(-4).toLowerCase() === 'json')
        fs.readFile(data, function(err, contents){
            if (err) console.stderr.write("Couldn't read data file");
            result = JSON.parse(contents);
        });

    else if (data.slice(0, 1) == '{' && data.slice(-1) == '}')
        result = JSON.parse(data);

    return result;
}

function outFile(file, outpath, ext) {
    return path.join(
        outpath,
        path.basename(file, path.extname(file)) + '.' + ext
    );
}

// expand files
var files = [];
for (var i = 0, len = program.args.length; i < len; i++)
    Array.prototype.push.apply(files, glob.sync(program.args[i]));

// check arguments
var err = '';
if (files.length == 0)
    err += 'error - please provide an input file\n';

if (files.length > 1) {

    if (!fs.lstatSync(program.output).isDirectory())
        program.output = path.dirname(program.output);

    if (!fs.lstatSync().isDirectory(program.output))
        err += 'error - output directory not found\n';

}
if (err) {
    process.stderr.write(err);
    process.exit(1);
}

//setup options
var data = parseData(program.data),
    options = {
        layout: program.layout || undefined,
        partials: program.partials ? glob.sync(program.partials).found : undefined
    };
    
    options.helpers = require(path.basename(program.helpers, path.extname(program.helpers)));
if (program.helper)

// render output
var taft = new Taft(data, options);

if (program.output === '-')
    console.log(taft.eat(files[0]));

else for (var i = 0, len = files.length, outFile, output; i < len; i++) {
    outfile = outFile(files[i], program.output, process.ext);
    output = taft.eat(files[i]);

    fs.writeFile(output, outfile, function(err) {
        if (err) process.stderr.write(err);
    });
}
