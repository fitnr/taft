#!/usr/bin/env node

var fs = require('fs');
var child = require('child_process');
var should = require('should');
var taft = require('..');

describe('Taft cli', function(){

    before(function(){

        this.command = 'bin/taft.js';
        this.nodeargs = [
                "-H 'tests/helpers/*.js'",
                '--data \'{"a": 2}\'',
                '--data tests/data/yaml.yaml',
                '--data tests/data/json.json',
                "--layout 'tests/layouts/*.html'",
                "--partial 'tests/partials/*.html'",
                'tests/pages/test.handlebars'
            ];

        this.Fixture = fs.readFileSync(__dirname + '/fixtures/index.html', {
            encoding: 'utf-8'
        });

    });

    it('should run and match fixture', function(done) {

        var Fixture = this.Fixture;

        child.exec(this.command +" "+ this.nodeargs.join(' '), function (e, result) {
            if (e) throw e;

            Fixture.trim().should.be.equal(result.trim(), 'Command line matches');

            done();
        });

    });

    it('should run silently', function(done) {
        child.exec(this.command +" --silent "+ this.nodeargs.join(' '), function(e, result, error) {
            if (e) throw e;

            error.should.equal('');

            done();
        });
    });

    it('should run verbosely', function(done) {
        child.exec(this.command +" --verbose "+ this.nodeargs.join(' '), function(e, result, error) {
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

    it('should return the file name with --output', function(done) {
        var fileName = 'tmp.html';

        child.exec(this.command + " -o " + fileName + ' ' + this.nodeargs.join(' '), function(e, result) {
            if (e) throw e;

            result.should.equal(fileName + '\n');

            child.exec('rm tmp.html');

            done();
        });
    });
});
