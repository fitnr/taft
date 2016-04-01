var should = require('should');
var rewire = require('rewire');
var datalib = rewire("../lib/data.js");

var basename = datalib.__get__('basename');
var getprefix = datalib.__get__('getprefix');
var parseObj = datalib.__get__('parseObj');
var readFile = datalib.__get__('readFile');
var readGlob = datalib.__get__('readGlob');
var readStdin = datalib.__get__('readStdin');

var catsAndDogs = {
    cat: "meow",
    dog: "woof",
    emoji: "🖥",
};

describe('data lib', function(){

    it('has all the functions', function(){
        basename.should.be.a.Function;
        getprefix.should.be.a.Function;
        parseObj.should.be.a.Function;
        readFile.should.be.a.Function;
        readGlob.should.be.a.Function;
        readStdin.should.be.a.Function;
    });

    it('basename returns a basename', function() {
        basename('file.txt').should.equal('file');
    });

    it('getprefix', function(){
        getprefix('thing:filename.txt').should.equal('thing');
        getprefix('thing:filename.txt:more').should.equal('thing');
    });

    it('parseObj reads JSON', function(){
        parseObj('{"foo": "bar"}').should.deepEqual({foo: "bar"});
    });

    it('parseObj reads YAML', function(){
        parseObj('---\nfoo: bar').should.deepEqual({foo: "bar"});
    });

    it('parseObj reads INI', function(){
        parseObj('foo= bar').should.deepEqual({foo: "bar"});
        parseObj('foo = bar').should.deepEqual({foo: "bar"});
        parseObj('foo=bar').should.deepEqual({foo: "bar"});
    });

    it('parseObj returns empty when it does not understand', function(){
        parseObj('lksdjflksdjf').should.deepEqual({});
    });

    it('readFile understands YAML and YFM', function(){
        readFile(__dirname + '/data/yaml.yaml').should.deepEqual(catsAndDogs, 'reads YAML');
        var foo = readFile(__dirname + '/pages/foo.html');
        foo.data.should.equal("Big Lub", 'reads YFM');
        foo.candy.should.equal("a variable from the page");
    });

    it('readFile understands JSON', function(){
        readFile(__dirname + '/data/json.json').should.deepEqual(catsAndDogs);
    });

    it('readFile understands INI', function(){
        readFile(__dirname + '/data/ini.ini').should.deepEqual({cat: "miaou"});
    });

    it('readFile errs when it does not understand', function(){
        should.throws(
            function(){ readFile('index.js'); },
            Error
        );
        should.throws(
            function(){ readFile('nonono.nonono'); },
            Error
        );
    });

    it('readGlob', function(){
        var glob = readGlob(__dirname + '/data/*');
        glob.ini.cat.should.equal('miaou', 'glob reads ini');
        glob.yaml.cat.should.equal('meow', 'glob reads yaml');
        glob.json.cat.should.equal('meow', 'glob reads json');
    });
});