#!/usr/bin/env node

var should = require('should');
var fs = require('fs');
var Taft = require('..');
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
    silent: true,
    handlebars: Handlebars
};

describe('Taft data', function(){
    before(function(){
        this.T = Taft(options);
        Handlebars.unregisterHelper('foo');
    });

    it('reads ini, json, yaml', function() {
        this.T._data.should.have.property('ini');
        this.T._data.should.have.property('yaml');
        this.T._data.should.have.property('json');

        this.T._data.ini.cat.should.equal('miaou');
        this.T._data.yaml.cat.should.equal('meow');
        this.T._data.json.cat.should.equal('meow');
    });

    it('parses a javascript object', function(){
        this.T._data.test.should.equal(true);
    });

    it('produces pages with that data that match fixtures/index-data.html', function() {
        fixture = fs.readFileSync(__dirname + '/fixtures/index-data.html', {encoding: 'utf-8'});
        result = ""+this.T.build(__dirname + '/pages/test.handlebars');
        result.should.equal(fixture);
    });

    it('accepts a prefix on a glob', function() {
        var fixture = fs.readFileSync(__dirname + '/fixtures/prefixed-list.txt', {encoding: 'utf-8'});
        var result = Taft({silent: true, data: 'cats:tests/data/*'})
            .build("tests/pages/prefix-list.handlebars");
        result.toString().should.equal(fixture);
    });
});