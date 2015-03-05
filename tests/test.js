#!/usr/bin/env node

var fs = require('fs');
var child = require('child_process'),
    concat = require('concat-stream');

require('colors');

var jsdiff = require('diff');

var should = require('should');

var taft = require('..');

function diff(a, b) {
    var _diff = jsdiff.diffChars(a, b);

    _diff.forEach(function(part) {
        // green for additions, red for deletions 
        // grey for common parts 
        var color = part.added ? 'green' : part.removed ? 'red' : 'grey';
        process.stderr.write(part.value[color]);
    });
    console.log();
}


taft.Taft.prototype.should.have.ownProperty('data', 'have data');

taft.Taft.prototype.should.have
    .properties(['layout', 'data', 'template', '_parseData', 'readFile', 'build', 'helpers', 'registerHelperFiles', 'partials', 'stderr', 'debug']);

taft.Taft.prototype.should.property('layout');

var T = new taft.Taft({
    verbose: true
});

T.should.be.instanceOf(taft.Taft)
    .and.have.properties(['verbose', 'silent', '_knownHelpers', '_data']);

T.should.not.have.property('applyLayout');

var options = {
    helpers: require('./helper.js'),
    layout: __dirname + '/template.html',
    partials: [__dirname + '/partial.html'],
    data: {
        a: 2
    },
    verbose: true
};

T = taft.Taft(options);

T.data([__dirname + '/data/json.json', __dirname + '/data/yaml.yaml']);

T.applyLayout.should.be.function;

T.should.be.instanceOf(taft.Taft);
T.helpers().should.be.instanceOf(taft.Taft);
T.partials().should.be.instanceOf(taft.Taft);
T.data().should.be.instanceOf(taft.Taft);

var result = T.build(__dirname + '/test.handlebars');

result.should.be.a.String;

var Fixture = '';

fs.readFile(__dirname + '/fixtures/index.html', {
    encoding: 'utf-8'
}, function(err, fixture) {
    if (err) console.error(err);

    try {
        Fixture = fixture;
        result.should.equal(fixture);

    } catch (e) {
        console.error('did not match');
        diff(fixture, result);
    }
});

var command = 'bin/taft.js',
    nodeargs = [
        '--verbose',
        '-H tests/helper.js',
        '--data \'{"a": 2}\'',
        '--data tests/data/yaml.yaml',
        '--data tests/data/json.json',
        '--layout tests/template.html',
        '--partial tests/partial.html',
        'tests/test.handlebars'
    ];

console.error("");
console.error(command, nodeargs.join(' '));

var exec = child.exec(command +" "+ nodeargs.join(' '), function(e, result, err) {
    if (e) throw e;

    console.error("");
    console.error(err);

    try {
        Fixture.trim().should.be.equal(result.trim(), 'Command line matches');

    } catch (e) {
        console.error('Command line did not match.');
        diff(Fixture, result);
    }
});
