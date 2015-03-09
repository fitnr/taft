var should = require('should');
var fs = require('fs');
var path = require('path');
var taft = require('..');

var options = {
    helpers: require('./helpers/helper.js'),
    partials: [__dirname + '/partials/partial.html'],
    data: [
        {a: 2},
        __dirname + '/data/json.json',
        __dirname + '/data/yaml.yaml'
    ],
    verbose: 0
};

describe('Taft building without layout', function(){

    before(function(){
        this.options = options;
        this.options.layouts = undefined;
        this.T = taft.Taft(this.options);
        this.fixture = fs.readFileSync(__dirname + '/fixtures/no-layout.html', {encoding: 'utf-8'});

        this.result = ""+this.T.build(__dirname + '/pages/test.handlebars');
    });

    it('should match fixture', function(){
        try {
            this.result.should.equal(this.fixture);
        } catch (e) {
            console.error('did not match');
            throw e;
        }

    });
});


