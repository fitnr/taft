#!/usr/bin/env node

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
        this.T.layouts(__dirname + '/layouts/default.handlebars');
        this.T._layouts.should.have.property('default.handlebars');
    });

    it('has the defaultLayout', function(){
        this.T._defaultLayout.should.equal('default.handlebars');
    });

    it('matches fixture', function(){
        result = ""+this.T.build(__dirname + '/pages/test.html');
        result.should.equal(this.fixture);
    });

    it('has a layout function', function(){
        this.T._layouts['default.handlebars'].should.be.a.function;
    });

});
