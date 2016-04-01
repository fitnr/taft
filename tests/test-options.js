#!/usr/bin/env node

var should = require('should');
var taft = require('..');

describe('taft options', function(){

    before(function(){

        var options = {
            defaultLayout: 'default.handlebars',
        };

        this.U = taft(options);
    });

    it('silent and verbose defaults', function(){
        this.U.silent.should.be.False;
        this.U.verbose.should.be.False;
    });

    it('default layout', function(){
        this.U._defaultLayout.should.equal('default.handlebars');
    });

});

describe('Taft chaining', function(){
    before(function(){
        this.T2 = new taft({
            layouts: [__dirname + '/layouts/default.handlebars', __dirname + '/partials/partial.handlebars']
        });
    });

    it('works', function(){
        this.T2.helpers([]).should.be.instanceOf(taft);
        this.T2.partials([]).should.be.instanceOf(taft);
        this.T2.data({a: 1}).should.be.instanceOf(taft);
        this.T2.layouts([]).should.be.instanceOf(taft);
    });

    it('works with defaultLayout', function(){
        this.T2.defaultLayout('default.handlebars').should.be.instanceOf(taft);
        this.T2._defaultLayout.should.equal('default.handlebars');
    });

    it('returns contents when arguments are empty', function(){
        this.T2.helpers().should.be.instanceOf(Array);
        this.T2.helpers().should.containDeep(['each']);

        this.T2.partials().should.be.instanceOf(Array);
        this.T2.partials().should.be.containDeep(['body']);

        this.T2.data([{b: 2}]);
        this.T2.data().should.be.instanceOf(Object);
        this.T2.data().a.should.equal(1);
        this.T2.data().b.should.equal(2);

        this.T2.layouts().should.be.instanceOf(Array);
        should.deepEqual(this.T2.layouts(), ['default.handlebars', 'partial.handlebars']);
    });

});