var should = require('should');
var fs = require('fs');
var Taft = require('..');

var options = {
    helpers: require('./helpers/helper.js'),
    partials: [__dirname + '/partials/partial.html'],
    data: [
        {a: 2},
        '{"bees": "bees"}',
        __dirname + '/data/json.json',
        __dirname + '/data/yaml.yaml'
    ],
    verbose: 0,
    silent: 1,
    layouts: [__dirname + '/layouts/default.html']
};

describe('When layout is false', function(){

    before(function(){
        this.taft = new Taft(options);
        this.fixture = fs.readFileSync(__dirname + '/fixtures/no-layout.html', {encoding: 'utf-8'});
    });

    it("ignore the default layout", function(){
        this.taft.build(__dirname + '/pages/no-layout.handlebars').toString().should.equal(this.fixture);
    });
});

describe('When layout equals the file', function(){

    before(function(){
        options.layouts = [__dirname + '/pages/test.handlebars'];
        options.verbose = 1;
        this.taft = new Taft(options);
        this.fixture = fs.readFileSync(__dirname + '/fixtures/no-layout.html', {encoding: 'utf-8'});
    });

    it("has defaultLayout equal to the fixture", function(){
        this.taft.defaultLayout().should.equal('test.handlebars');
    });

    it("ignore the layout", function(){
        this.taft.build(__dirname + '/pages/test.handlebars').toString().should.equal(this.fixture);
    });

});
