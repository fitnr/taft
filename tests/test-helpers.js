#!/usr/bin/env node

var should = require('should');
var taft = require('..');

describe('taft helpers', function(){

    it('should have registered helpers', function(){
        W = new taft.Taft({
            defaultLayout: 'basic',
            helpers: ['tests/helpers/cow-helper.js'],
        });

        W._knownHelpers.should.containEql('cow');
    });

    it('should register a helper string', function() {
        S = new taft.Taft({
            helpers: 'tests/helpers/other-helpers.js',
        });

        S._knownHelpers.should.containEql('goo');
    });
});