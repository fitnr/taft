var should = require('should');
var taft = require('..');

describe('Taft chaining', function(){
    it('Should chain', function(){
        T.helpers().should.be.instanceOf(taft.Taft);
        T.partials().should.be.instanceOf(taft.Taft);
        T.data().should.be.instanceOf(taft.Taft);
    });
});