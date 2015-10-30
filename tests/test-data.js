#!/usr/bin/env node

var should = require('should');
var fs = require('fs');
var taft = require('..');
var Handlebars = require('handlebars');

var options = {
    data: [
        __dirname + '/data/ini.ini',
        __dirname + '/data/json.json',
        __dirname + '/data/yaml.yaml',
        {"test": true},
        {"a": 2},
        '{"bees": "bees"}',
    ],
    handlebars: Handlebars
};

describe('Taft data', function(){
    before(function(){
        this.T = taft(options);
        Handlebars.unregisterHelper('foo');
    });

    it('should read ini, json, yaml', function() {
        this.T._data.should.have.property('ini');
        this.T._data.should.have.property('yaml');
        this.T._data.should.have.property('json');

        this.T._data.ini.cat.should.equal('miaou');
        this.T._data.yaml.cat.should.equal('meow');
        this.T._data.json.cat.should.equal('meow');
    });

    it('should parse a javascript object', function(){
        this.T._data.test.should.equal(true);
    });

    it('should produce pages with that data that match fixtures/index-data.html', function() {
        fixture = fs.readFileSync(__dirname + '/fixtures/index-data.html', {encoding: 'utf-8'});
        result = ""+this.T.build(__dirname + '/pages/test.handlebars');
        result.should.equal(fixture);
    });
});