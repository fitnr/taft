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

    it('register a helper package', function() {
        S = new taft({
            helpers: 'handlebars-helper-br',
        });

        S._helpers.should.containEql('br');
    });

    it('uses the helper package', function() {
        var result = ""+ S.build(__dirname + '/pages/br.html');
        result.trim().should.equal('<br>');
    });

});