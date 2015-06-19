#!/usr/bin/env node

var should = require('should');
var taft = require('..');
var Handlebars = require('handlebars');

describe('taft helpers', function(){

    it('should have registered helpers', function(){
        W = new taft({
            defaultLayout: 'basic',
            helpers: ['tests/helpers/cow-helper.js'],
            handlebars: Handlebars
        });

        W._knownHelpers.should.containEql('cow');
    });

    it('should register a helper string', function() {
        S = new taft({
            helpers: 'tests/helpers/other-helpers.js',
        });

        S._knownHelpers.should.containEql('goo');
    });
});