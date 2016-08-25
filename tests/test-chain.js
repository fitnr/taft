#!/usr/bin/env node

var should = require('should');
var taft = require('..');

describe('Taft chaining', function(){
    before(function(){
        this.T2 = new taft({
            layouts: [__dirname + '/layouts/default.handlebars', __dirname + '/partials/partial.handlebars'],
            partials: [__dirname + '/partials/partial.handlebars'],
        });
    });

    it('works', function(){
        this.T2.helpers([]).should.be.instanceOf(taft);
        this.T2.partials([]).should.be.instanceOf(taft);
        this.T2.data({a: 1}).should.be.instanceOf(taft);
        this.T2.layouts([]).should.be.instanceOf(taft);
    });

    it('defaultLayout chains', function(){
        this.T2.defaultLayout('default').should.be.instanceOf(taft);
        this.T2.defaultLayout('default.handlebars').should.be.instanceOf(taft);
        try {
            this.T2.defaultLayout().should.equal('default');    
        } catch (e) {
            console.error(this.T2.layouts());
            console.error(this.T2.defaultLayout())
            throw e;
        }
    });

    it('helpers returns contents when arguments are empty', function(){
        this.T2.helpers().should.be.instanceOf(Array);
        this.T2.helpers().should.containDeep(['each']);
    });

    it('partials returns contents when arguments are empty', function(){
        this.T2.partials().should.be.instanceOf(Array);
        this.T2.partials().should.be.containDeep(['partial']);
    });

    it('data returns contents when arguments are empty', function(){
        this.T2.data([{b: 2}]);
        this.T2.data().should.be.instanceOf(Object);
        this.T2.data().a.should.equal(1);
        this.T2.data().b.should.equal(2);
    });

    it('layouts returns contents when arguments are empty', function(){
        this.T2.layouts().should.be.instanceOf(Set);
        should.deepEqual(this.T2.layouts(), new Set(['default', 'partial']));
    });

});
