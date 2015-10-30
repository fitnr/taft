var should = require('should');
var fs = require('fs');
var Taft = require('..');

var options = {
    helpers: require('./helpers/helper.js'),
    partials: [__dirname + '/partials/partial.html'],
    data: [
        {a: 2},
        '{"bees": "bees"}',
        __dirname + '/data/json.json',
        __dirname + '/data/yaml.yaml'
    ],
    layouts: [__dirname + '/layouts/default.html'],
    verbose: 0,
    silent: 1,
};

describe('Taft shorthand', function() {

    before(function(){
        this.result = Taft.taft(__dirname + '/pages/test.handlebars', options);

        this.fixture = fs.readFileSync(__dirname + '/fixtures/index.html', {encoding: 'utf-8'});
    });

    it('should match fixture', function(){
        this.result.should.equal(this.fixture);
    });

});
