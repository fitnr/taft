#!/usr/bin/env node

var should = require('should');
var taft = require('..');

describe('Taft properties', function(){
    it('have data', function(){
        taft.prototype.should.have.ownProperty('data', 'have data');
    });

    it('are correct', function(){
        taft.prototype.should.have
            .properties(['layouts', 'data', 'template', 'build', 'helpers', 'partials', 'stderr', 'debug', '_applyLayout']);

    });

    var T = new taft({
        verbose: true
    });

    it('instance of itself', function(){
        T.should.be.instanceOf(taft)
            .and.have.properties(['verbose', 'silent', '_knownHelpers', '_data', '_options',
                '_templates', '_layouts']);
    });

    it('speak when spoken to', function(){
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

    if('should be instance of Taft', function(){
        T.should.be.instanceOf(taft);
    });

    it('should accept data', function(){
        T == T.data([__dirname + '/data/json.json', __dirname + '/data/yaml.yaml']);
    });

    it('have _applyLayout function', function(){
        T._applyLayout.should.be.function;
    });

});
