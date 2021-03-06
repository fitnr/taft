var should = require('should');
var fs = require('fs');
var taft = require('..');

var options = {
    helpers: require('./helpers/helper.js'),
    partials: [__dirname + '/partials/partial.handlebars'],
    data: [
        {a: 2},
        '{"bees": "bees"}',
        __dirname + '/data/json.json',
        __dirname + '/data/yaml.yaml'
    ],
    verbose: 0
};


describe('Taft building with layout', function(){

    before(function(){
        this.T = taft(options);
        this.fixture = fs.readFileSync(__dirname + '/fixtures/index.html', {encoding: 'utf-8'});
    });

    it('has the default layout', function(){
        var x = __dirname + '/layouts/default.handlebars';
        this.T.layouts(x);
        this.T.layouts().has('default').should.be.true;
    });

    it('has the defaultLayout', function(){
        this.T._defaultLayout.should.equal('default');
    });

    it('matches fixture', function(){
        var result = ""+this.T.build(__dirname + '/pages/test.html');
        result.should.equal(this.fixture);
    });

    it('has a layout function', function(){
        this.T._getLayout('default').should.be.a.function;
        this.T._getLayout('default.handlebars').should.be.a.function;
    });

    it('ignored file marked published=false', function() {
        var unpub = this.T.build(__dirname + '/pages/unpublished.html');
        should.not.exist(unpub, 'unpublished files do not exist');
    });
});
