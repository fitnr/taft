#!/usr/bin/env node

var should = require('should');
var fs = require('fs');
var taft = require('..');
var Template = require('../lib/template.js');

var options = {
    helpers: require('./helpers/helper.js'),
    partials: [__dirname + '/partials/partial.html'],
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

    it('should have the default layout', function(){
        this.T.layouts(__dirname + '/layouts/default.html');
        this.T._layouts.should.have.property('default.html');
    });

    it('should have the defaultLayout', function(){
        this.T._defaultLayout.should.equal('default.html');
    });

    it('should match fixture', function(){
        result = ""+this.T.build(__dirname + '/pages/test.handlebars');
        result.should.equal(this.fixture);
    });

    it('should have a layout function', function(){
        this.T._layouts['default.html'].should.be.a.function;
    });

    it('should have a template function with some properties', function(){
        this.T._templates[__dirname + '/pages/test.handlebars'].should.have.a.property('compile');
        this.T._templates[__dirname + '/pages/test.handlebars'].should.have.a.property('build');
        this.T._templates[__dirname + '/pages/test.handlebars'].should.have.a.property('layout');
    });

});
