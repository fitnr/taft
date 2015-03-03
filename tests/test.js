var taft = require('..');
var fs = require('fs');

var T = new taft.Taft({a: 2}, {
    helpers: require('./helper.js'),
    layout: __dirname + '/template.html',
    partials: [__dirname + '/partial.html']
});

var result = T.eat(__dirname + '/test.handlebars');

fs.readFile(__dirname + '/fixtures/index.html', {encoding: 'utf-8'}, function(err, fixture) {
    if (err) console.error(err);
    try {
        console.assert(fixture === result);    
    } catch (e) {
        console.error('did not match')
        console.error(fixture);
        console.error(result);
    }
});