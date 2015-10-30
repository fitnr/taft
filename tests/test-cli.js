#!/usr/bin/env node

var fs = require('fs');
var child = require('child_process');
var should = require('should');
var taft = require('..');

command = 'bin/taft.js';
nodeargs = [
        "-H 'tests/helpers/*.js'",
        '--data \'{"a": 2}\'',
        '--data \'{"bees": "bees"}\'',
        '--data tests/data/yaml.yaml',
        '--data tests/data/json.json',
        "--layout 'tests/layouts/*.html'",
        "--partial 'tests/partials/*.html'",
        'tests/pages/test.handlebars'
    ];

Fixture = fs.readFileSync(__dirname + '/fixtures/index.html', {
    encoding: 'utf-8'
});

describe('Taft cli', function(){

    it('should give help when asked', function(done) {
        child.exec(command +" --help", function (e, result, error) {
            if (e) throw e;

            if (error) console.error(error);

            result.trim().indexOf('Usage: taft').should.be.above(-1);

            done();
        });
    });

    it('should match fixture', function(done) {
        child.exec(command + ' --output tmp.html '  +nodeargs.join(' '), function (e, result, error) {
            if (e) throw e;
            if (error) console.error(error);

            var read = fs.readFileSync('tmp.html', {encoding: 'utf-8'});
            Fixture.trim().should.be.equal(read.trim(), 'New file matches');
            result.trim().should.be.equal('tmp.html', 'Returns file name');
            child.exec('rm tmp.html');

            done();
        });
    });

    it('should run silently', function(done) {
        child.exec(command +" --silent --output tmp.html "+ nodeargs.join(' '), function(e, result, error) {
            child.exec('rm tmp.html');

            if (e) throw e;

            error.should.equal('');
            done();
        });
    });

    it('should run verbosely', function(done) {
        child.exec(command +" --verbose "+ nodeargs.join(' '), function(e, result, error) {
            if (e) throw e;

            error.should.not.equal('');

            error.indexOf('Reading file').should.be.above(-1);
            error.indexOf('registered helpers').should.be.above(-1);
            error.indexOf('Adding layout').should.be.above(-1);
            error.indexOf('registered partials').should.be.above(-1);
            error.indexOf('Set default layout').should.be.above(-1);
            error.indexOf('Parsing').should.be.above(-1);
            error.indexOf('building').should.be.above(-1);

            done();
        });
    });
});
