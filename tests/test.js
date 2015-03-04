var taft = require('..');
var fs = require('fs');
var spawn = require('child_process').spawn;

var T = new taft.Taft({
    helpers: require('./helper.js'),
    layout: __dirname + '/template.html',
    partials: [__dirname + '/partial.html']
}, {a: 2});

var result = T.build(__dirname + '/test.handlebars');

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

var command = 'node',
    args = [
        'bin/taft.js',
        '-H tests/helper.js',
        '-d \'{"a": 2}\'',
        '--layout tests/template.html',
        '-p tests/partial.html',
        'tests/test.handlebars'
    ];

    var child = spawn(command, args);    

    child.on('close', function(code){
        try {
            console.assert(code === 0);
            console.assert(child.stdout = result);
        } catch (e) {
            console.error(e);
        }
    });
