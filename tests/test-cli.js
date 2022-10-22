/*jshint esnext: true */
const fs = require('fs');
const child = require('child_process');
const should = require('should');

const command = 'bin/taft.js';
const execArgs = [
        '--quiet',
        '-H', "'tests/helpers/*.js'",
        '--data \'{"a": 2}\'',
        '--data \'{"bees": "bees"}\'',
        '--data tests/data/yaml.yaml',
        '--data tests/data/json.json',
        '--layout', "'tests/layouts/*'",
        '-y default.handlebars',
        "--partial 'tests/partials/*'",
        'tests/pages/test.html'
    ];

const Fixture = fs.readFileSync(__dirname + '/fixtures/index.html', {encoding: 'utf-8'});

describe('Taft cli', function(){
    it('gives help when asked', function(done) {
        this.timeout(500);
        child.exec(command +" --help", function (e, result, error) {
            if (e) throw e;
            if (error) console.error(error);
            result.trim().indexOf('Usage: taft').should.be.above(-1);
            done();
        });
    });

    it('matches fixture', function(done) {
        this.timeout(500);
        var args = [
            ' --verbose',
            "-H 'tests/helpers/*.js'",
            '--data a=2',
            '--data bees=bees',
            '--data tests/data/yaml.yaml',
            '--data tests/data/json.json',
            '--layout', "'tests/layouts/*.handlebars'",
            '--partial', "'tests/partials/*.handlebars'",
            '-y default.handlebars',
            'tests/pages/test.html',
            '-o tmp.html'
        ];
        var cmd = command + args.join(' ');
        child.exec(cmd, {encoding: 'utf-8'}, err => {
            if (err) console.error(err);
            var read = fs.readFileSync('tmp.html', {encoding: 'utf-8'});
            Fixture.trim().should.be.equal(read.trim(), 'New file matches: ' + cmd);
            done();
        });
    });

    it('accepts prefixed data glob as list', function(done) {
        this.timeout(1000);
        var fixture = fs.readFileSync(__dirname + '/fixtures/prefixed-list.txt', {encoding: 'utf-8'});
        var args = " --output tmp.html --silent --data 'cats:tests/data/*' tests/pages/prefix-list.html";
        child.exec(command + args, function (e, result, error) {
            var read = fs.readFileSync('tmp.html', {encoding: 'utf-8'});
            fixture.trim().should.be.equal(read.trim(), 'New file matches');
            child.exec('rm tmp.html');
            done();
        });
    });

    it('runs silently', function(done) {
        this.timeout(1000);
        var cmd = command + " --silent --output tmp.html " + execArgs.join(' ');
        child.exec(cmd, (e, result, error) => {
            child.exec('rm tmp.html');
            if (e) throw e;
            error.should.equal('', cmd);
            done();
        });
    });

    it('runs verbosely', function(done) {
        this.timeout(1000);
        var exec = command +" --verbose "+ execArgs.join(' ');
        child.exec(exec, function(e, result, error) {
            if (e) throw e;
            error.should.not.equal('');
            error.indexOf('registered helpers').should.be.above(-1, 'registered helpers: ' + exec);
            error.indexOf('registered partials').should.be.above(-1, 'registered partials: ' + exec);
            error.indexOf('set default layout').should.be.above(-1, 'set default layout: ' + exec);
            error.indexOf('building').should.be.above(-1, 'building: ' + exec);
            done();
        });
    });

    it('accepts piped-in data with prefixed "-"', function(done) {
        const cmd = [
            command,
            "--data", "json:-",
            '--data', 'tests/data/yaml.yaml',
            '--data', 'tests/data/ini.ini',
            '--data', 'bees=cool',
            "-H", "tests/helpers/helper.js",
            "tests/pages/test.html"
        ];
        const infile = __dirname + '/data/json.json';
        const fixture = fs.readFileSync(__dirname + '/fixtures/fixtures-data.html', {encoding: 'utf-8'});
        child.exec(`cat ${infile} | ` + cmd.join(' '), (e, stdout, stderr) => {
            if (e) throw e;
            stdout.toString().should.be.equal(fixture, 'New file matches');
            stderr.should.be.equal('');
            done()
        });
    });

    it('accepts piped-in data with prefixed "/dev/stdin"', function(done) {
        const cmd = [
            command,
            '--data', 'tests/data/json.json',
            '--data', 'tests/data/ini.ini',
            '--data', 'yaml:/dev/stdin',
            '--data', "'{\"bees\": \"cool\"}'",
            '-H', 'tests/helpers/helper.js',
            'tests/pages/test.html',
        ];
        const infile = __dirname + '/data/yaml.yaml';
        const fixture = fs.readFileSync(__dirname + '/fixtures/fixtures-data.html', {encoding: 'utf-8'});
        child.exec(`cat ${infile} | ` + cmd.join(' '), (e, stdout, stderr) => {
            if (e) throw e;
            stdout.should.be.equal(fixture, 'New file matches');
            stderr.should.be.equal('');
            done();
        });
    });

    it('accepts piped-in JSON with bare "-"', function(done) {
        const cmd  = `cat tests/data/json.json | ${command} --data - tests/pages/simple.html`;
        child.exec(cmd, (e, stdout, stderr) => {
            if (e) throw e;
            stdout.should.be.equal("<p>meow</p>\n", 'Result matches with JSON data');
            stderr.should.be.equal('');
            done();
        });
    });

    it('accepts piped-in YAML with bare "-"', function(done) {
        const cmd  = `cat tests/data/yaml.yaml | ${command} --data - tests/pages/simple.html`;
        child.exec(cmd, (e, stdout, stderr) => {
            if (e) throw e;
            stdout.should.be.equal("<p>meow</p>\n", 'Result matches with YAML data');
            stderr.should.be.equal('');
            done();
        });
    });

    it('accepts piped-in INI with bare "-"', function(done) {
        const cmd  = `cat tests/data/ini.ini | ${command} --data - tests/pages/simple.html`;
        child.exec(cmd, (e, stdout, stderr) => {
            if (e) throw e;
            stdout.should.be.equal("<p>miaou</p>\n", 'Result matches with INI data');
            stderr.should.be.equal('');
            done();
        });
    });
});
