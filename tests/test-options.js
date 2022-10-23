var should = require('should');
var Taft = require('..');

describe('taft options', function(){

    before(function(){

        var options = {
            defaultLayout: 'default.handlebars',
        };

        this.U = new Taft(options);
    });

    it('silent and verbose defaults', function(){
        this.U.silent.should.be.False;
        this.U.verbose.should.be.False;
    });

    it('default layout', function(){
        this.U._defaultLayout.should.equal('default');
    });

});
