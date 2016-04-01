#!/usr/bin/env node

var should = require('should');
var taft = require('..');

describe('Taft properties', function(){
    it('include "data"', function(){
        taft.prototype.should.have.ownProperty('data', 'have data');
    });

    it('are correct', function(){
        taft.prototype.should.have
            .properties(['layouts', 'data', 'build', 'helpers', 'partials', 'stderr', 'debug', '_applyLayout']);

    });

    var T = new taft({
        verbose: true
    });

    it('are complete', function(){
        T.should.be.instanceOf(taft)
            .and.have.properties(['verbose', 'silent', '_helpers', '_data', '_options', '_layouts']);
    });

    it('speaks when spoken to', function(){
        T.silent.should.be.False;
        T.verbose.should.be.True;
    });
});

describe('Taft functions', function(){

    var options = {
        helpers: require('./helpers/helper.js'),
        layout: __dirname + '/layouts/default.html',
        partials: [__dirname + '/partials/partial.html'],
        data: {
            a: 2
        },
        verbose: 0
    };

    T = taft(options);

    it('accept data', function(){
        T == T.data([__dirname + '/data/json.json', __dirname + '/data/yaml.yaml']);
    });

    it('include _applyLayout', function(){
        T._applyLayout.should.be.function;
    });

});
