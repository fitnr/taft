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

describe('Taft creating templates', function(){

    before(function(){
        this.T = taft(options);
        this.fixture = fs.readFileSync(__dirname + '/fixtures/index.html', {encoding: 'utf-8'});
    });

    it('should be a template object', function(){
        this.result = this.T.build(__dirname + '/pages/test.handlebars');
        this.T._createTemplate(__dirname + '/pages/test.handlebars');
    });

    it('template object should have data getter', function(){
        this.T._templates[__dirname + '/pages/test.handlebars'].data.a.should.equal(2);
    });

    it('should have a template object named ' + __dirname + '/pages/test.handlebars', function(){
        this.T._templates.should.have.a.property(path.resolve(__dirname + '/pages/test.handlebars'));

        it('should be an instance of template', function(){
            this.T._templates.test.should.be.instanceof(Template);
        });
    });


});