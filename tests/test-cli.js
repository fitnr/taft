#!/usr/bin/env node

var fs = require('fs');
var child = require('child_process');
var should = require('should');
var taft = require('..');

describe('Taft cli', function(){

    before(function(){

        this.command = 'bin/taft.js';
        this.nodeargs = [
                '--verbose',
                "-H 'tests/helpers/*.js'",
                '--data \'{"a": 2}\'',
                '--data tests/data/yaml.yaml',
                '--data tests/data/json.json',
                "--layout 'tests/layouts/*.html'",
                "--partial 'tests/partials/*.html'",
                'tests/test.handlebars'
            ];

        console.error("");
        console.error(this.command, this.nodeargs.join(' '));

        this.Fixture = fs.readFileSync(__dirname + '/fixtures/index.html', {
            encoding: 'utf-8'
        });

    });

    it('cli should run', function(){

        var Fixture = this.Fixture;

        child.exec(this.command +" "+ this.nodeargs.join(' '), function(e, result, err) {
            if (e) throw e;

            console.error("");
            console.error(err);

            Fixture.trim().should.be.equal(result.trim(), 'Command line matches');
        });
    });

});