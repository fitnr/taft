var should = require('should');
var path = require('path');
var fs = require('fs');
var taft = require('..');
var Template = require('../lib/template.js');

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

describe('Taft template object', function(){

    before(function(){
        this.T = taft(options);
        this.fixture = fs.readFileSync(__dirname + '/fixtures/index.html', {encoding: 'utf-8'});
    });

    it('exists', function(){
        this.result = this.T.build(__dirname + '/pages/test.html');
        this.T._createTemplate(__dirname + '/pages/test.html');
    });

    it('has data getter', function(){
        this.T._templates[__dirname + '/pages/test.html'].data.a.should.equal(2);
    });

    it('is named ' + __dirname + '/pages/test.html', function(){
        this.T._templates.should.have.a.property(path.resolve(__dirname + '/pages/test.html'));

        it('should be an instance of template', function(){
            this.T._templates.test.should.be.instanceof(Template);
        });
    });


});