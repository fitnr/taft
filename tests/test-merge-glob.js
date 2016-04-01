var should = require('should');
var mergeGlob = require("../lib/merge-glob");


describe('merge-glob', function() {

    it('is a function', function(){
        mergeGlob.should.be.instanceof(Function, 'is a function');
    });

    it('accepts a list of files', function(){
        var files = [
            __dirname + '/pages/foo.html',
            __dirname + '/pages/pages.html',
            __dirname + '/pages/test.html',
        ]
        var merge = mergeGlob(files);
        merge.should.be.instanceof(Array, 'is an array');
        merge.length.should.equal(3);
    });

    it('accepts a single glob', function() {
        var merge = mergeGlob(__dirname + '/pages/*');
        merge.should.be.instanceof(Array, 'is an array');
        merge.should.containEql(__dirname + '/pages/foo.html');

        var merge = mergeGlob([__dirname + '/pages/*']);
        merge.should.be.instanceof(Array, 'is an array');
        merge.should.containEql(__dirname + '/pages/foo.html');
    });

    it('accepts a mix of globs and files', function() {
        var merge = mergeGlob([__dirname + '/pages/*', __dirname + '/data/ini.ini']);
        merge.should.be.instanceof(Array, 'is an array');
        merge.should.containEql(__dirname + '/pages/foo.html');
        merge.should.containEql(__dirname + '/data/ini.ini');
    });
});
