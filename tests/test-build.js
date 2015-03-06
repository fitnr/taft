#!/usr/bin/env node

var should = require('should');
var fs = require('fs');
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

        this.result = this.T.build(__dirname + '/pages/test.handlebars');
    });

    it('should return a string', function(){
        this.result.should.be.a.String;
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


describe('Taft building with layout', function(){

    before(function(){
        this.T = taft.Taft(options);
        this.fixture = fs.readFileSync(__dirname + '/fixtures/index.html', {encoding: 'utf-8'});
    });

    it('should have the default layout', function(){
        T = this.T.layouts(__dirname + '/layouts/default.html');
        this.T._layouts.should.have.property('default');
    });

    it('should match fixture', function(){
        this.result = this.T.build(__dirname + '/pages/test.handlebars');
        this.result.should.equal(this.fixture);
    });

    it('should have a layout function', function(){
        this.T._layouts.default.should.be.a.function;
    });

    it('should return a string', function(){
        this.result.should.be.a.String;
    });

    it('should have a template function named "test"', function(){
        this.T._templates.should.have.a.property('test');
        this.T._templates.test.should.be.a.function;
    });

    it('should have a template function with data and layout properties', function(){
        this.T._templates.test.should.have.a.property('data');
        this.T._templates.test.should.have.a.property('layout');
    });

});
