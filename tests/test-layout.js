var should = require('should');
var fs = require('fs');
var Taft = require('..');

var data = [
    {a: 2},
    '{"bees": "bees"}',
    __dirname + '/data/json.json',
    __dirname + '/data/yaml.yaml',
    __dirname + '/data/ini.ini'
];

var options = {
    helpers: require('./helpers/helper.js'),
    partials: [__dirname + '/partials/partial.handlebars'],
    data: data,
    verbose: 0,
    silent: 1,
    layouts: [__dirname + '/layouts/default.handlebars']
};

describe('When layout is false', function(){

    before(function(){
        this.taft = new Taft(options);
        this.fixture = fs.readFileSync(__dirname + '/fixtures/no-layout.html', {encoding: 'utf-8'});
    });

    it("ignore the default layout", function(){
        this.taft.build(__dirname + '/pages/no-layout.html').toString().should.equal(this.fixture);
    });
});

describe('When layout equals the file', function(){

    before(function(){
        options.layouts = [__dirname + '/pages/test.html'];
        options.verbose = 1;
        this.taft = new Taft(options);
        this.fixture = fs.readFileSync(__dirname + '/fixtures/no-layout.html', {encoding: 'utf-8'});
    });

    it("defaultLayout equals the fixture", function(){
        this.taft.defaultLayout().should.equal('test');
    });

    it("taft ignores the layout", function(){
        this.taft.build(__dirname + '/pages/test.html').toString().should.equal(this.fixture);
    });
});

describe('When building nested layouts', function(){

    before(function(){
        var options = {
            helpers: ['tests/helpers/helper.js'],
            partials: ['tests/partials/partial.handlebars'],
            data: data,
            verbose: 0,
            silent: 1,
            layouts: ['tests/layouts/*.handlebars'],
            'defaultLayout': 'special.handlebars'
        };
        this.taft = new Taft(options);
        this.fixture = fs.readFileSync(__dirname + '/fixtures/nested.html', {encoding: 'utf-8'});
    });

    it('builds them like a normal person', function(){
        this.taft.build('tests/pages/nested.html').toString().should.equal(this.fixture);
    });
});
