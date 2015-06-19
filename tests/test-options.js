#!/usr/bin/env node

var should = require('should');
var taft = require('..');

describe('taft options', function(){

    before(function(){

        var options = {
            defaultLayout: 'basic.hbs',
        };

        this.U = taft(options);
    });

    it('should silent and verbose defaults', function(){
        this.U.silent.should.be.False;
        this.U.verbose.should.be.False;
    });

    it('should have default layout', function(){
        this.U._defaultLayout.should.equal('basic.hbs');
    });

});

describe('Taft chaining', function(){
    before(function(){
        this.T2 = new taft({
            layouts: [__dirname + '/layouts/default.html', __dirname + '/partials/partial.html']
        });
    });

    it('Should chain', function(){
        this.T2.helpers([]).should.be.instanceOf(taft);
        this.T2.partials([]).should.be.instanceOf(taft);
        this.T2.data([]).should.be.instanceOf(taft);
        this.T2.layouts([]).should.be.instanceOf(taft);
    });

    it('defaultLayout should work', function(){
        this.T2.defaultLayout('default.html').should.be.instanceOf(taft);
        this.T2._defaultLayout.should.equal('default.html');
    });

});