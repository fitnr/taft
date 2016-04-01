#!/usr/bin/env node

var should = require('should');
var taft = require('..');
var Handlebars = require('handlebars');

describe('taft helpers', function(){

    it('register', function(){
        W = new taft({
            defaultLayout: 'basic',
            helpers: ['tests/helpers/cow-helper.js'],
            handlebars: Handlebars
        });

        W._helpers.should.containEql('cow');
    });

    it('register a helper string', function() {
        S = new taft({
            helpers: 'tests/helpers/other-helpers.js',
        });

        S._helpers.should.containEql('goo');
    });
});