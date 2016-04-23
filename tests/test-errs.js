#!/usr/bin/env node

var should = require('should');
var Taft = require('..');

describe('Taft errors', function(){
    before(function(){
        this.T = new Taft({
            silent: true,
            layouts: [__dirname + '/layouts/default.handlebars', __dirname + '/partials/partial.handlebars'],
            partials: [__dirname + '/partials/partial.handlebars'],
        });
    });

    it('empty result when duplicate keys exist', function (done) {
        var build = this.T.build(__dirname + '/dup/index.html')
        build.toString().should.equal('');
        build.source.should.equal(__dirname + '/dup/index.html');
        done();
    });

    it('reading data with duplicate keys leads to empty data', function (done) {
        var T = new Taft({silent: true, data: __dirname + '/dup/data.yaml'})

        T.data().should.be.deepEqual({})

        var build = T.build(__dirname + '/pages/foo.html');
        build.toString().length.should.be.greaterThan(1);
        build.source.should.be.equal(__dirname + '/pages/foo.html');

        done();
    });
});
