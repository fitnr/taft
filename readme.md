# Taft

Generate static html files from Handlebars files with YAML front matter.

Intended as a pandoc-like tool for building a simple page, or even for generating basic static websites. Taft is lightning fast and simple to use.

## command line

### Basics

Say you have this file. It's handlebars with yaml front matter.

````handlebars
---
cauldronStatus: bubbling
workplace: cavern
script: magic-spells.js
---
<p>The cauldron in my {{workplace}} is {{cauldronStatus}}.</p>
<script src="{{script}}"></script>
````

Run this command:
````
$ taft source/page1.hbs 
taft building source/page1.hbs
<p>My cauldron is bubbling and my cat is black.</p>
<script src="magic-spells.js"></script>
````

Note that the status message outputs to stderr, so one can safely pipe the result.

By default, output goes to stdout. Specify a single output file with `--output` or `-o`:
````
$ taft source/page1.hbs -o build/page1.html
build/page1.html
````

To generate more than one file, just pass a destination directory.
````
$ taft source/page1.hbs source/page2.hbs other/*.hbs --dest-dir build/
taft building source/page1.hbs
build/page1.html
taft building source/page2.hbs
build/page2.html
taft building other/more.hbs
build/more.html
````

Read from stdin by giving '-' as the file name.

````
# useless use of cat
$ cat source/page1.hbs | taft - > build/page1.html
````

### Layouts
Use a layout (aka template) to wrap a file with content. The layout should use the `{{> body}}` helper to refer to the content.

The data on the child page is available on the layout. If there's a conflict, use the 'page' prefix.
````handlebars
---
workplace: haunted wood
script: main.js
---
<p>Notes from the {{page.workplace}} and the {{workplace}}.</p>
{{> body}}
<script src="{{script}}"></script>
````
````
$ taft --layout layouts/template.hbs source/page1.hbs > build/page1.html
````
````html
<p>Notes from the cavern and the haunted wood.</p>
<p>The cauldron in my cavern is bubbling.</p>
<script src="magic-spells.js"></script>
<script src="main.js"></script>
````

It more than one layout is registered, specify the one to use with `layout: <name>` in the page's front matter.
If a layout named 'default' is registered, it will be used even with a page doesn't have a layout key.

````
$ taft --layout layouts/default.hbs --layout layouts/potions.hbs 
    source/page1.hbs source/page2.hbs source/page3.hbs -C _source -D build
````

````yaml
---
# source/page1.hbs
# This page will be built with the 'default' layout
title: My Favorite Encantations
---
Encantations...
````
````yaml
---
# source/page2.hbs
# This page will be built with the 'potions' layout
title: Special Potions
layout: potions
---
Potions...
````
````yaml
---
# source/page3.hbs
# This page will be built without a layout
layout: none
title: Super-Special Page
---
Special Stuff...
````

### Partials
Taft will register partials from one or more files.

````
# Register the partial {{> fun}}
$ taft --partial partials/fun.hbs source/page1.hbs > build/page1.html
taft building source/page1.hbs

# Register the all the partials in partials/
$ taft --partial 'partials/*.hbs' source/page1.hbs > build/page1.html
taft building source/page1.hbs
````

### Helpers

Taft will register helpers for you. You pass it a file that `exports` a helper, or the name of a NPM module, Taft will register it to Handlebars.

````
$ taft --helper helpers/magic.js source/page1.hbs > build/page1.hbs
````
````
$ npm install handlebars-helper-minify
$ taft --helper handlebars-helper-minify source/page1.hbs > build/page1.hbs
````

If you're using a custom file, you can either export a function or an object containing several functions. In the former format, the function will be called with two arguments: `Handlebars` and `Taft.options`. In the latter format, the key of each function is the name of the helper.

````javascript
// This will be available in Handlebars as '{{magic}}'

module.exports = function(Handlebars, options) {
    Handlebars.registerHelper('magic', function(){
        /* do stuff */
    });
}
````

````javascript
// {{whiteMagic}} and {{blackMagic}}

// Use your favorite node module
var spells = require('spells');

module.exports = {
    whiteMagic: function() { /* do stuff */ },

    blackMagic function() { /* do bad stuff */ }
};
````

<!-- Taft comes packaged with the helpers in the [handlebars-helpers](https://github.com/assemble/handlebars-helpers) library. -->

### Data

In addition to the YAML front matter in layouts and pages, Taft will read data from YAML or JSON files, or from stdin. Use '-' as the file name to read from stdin.

````
$ taft --data data/data.yaml source/page1.hbs > build/page1.hbs
$ echo '{"workplace": "haunted forest"}' | taft --data - source/page2.hbs > build/page2.hbs
````

Data read from stdin can be placed in a named object using the format `key:-`. You could combine this with a [tool that reads yaml front matter](https://github.com/fitnr/yfm-concat) to build navigation elements.

````
$ echo '["guffaw", "cackle"]' | taft --data laughs:- source/page2.hbs > build/page2.hbs
````
````handlebars
{{#laughs}}
    // do stuff
{{/laugh}}
````

### Other options

* `--default-layout`: The basename of the layout to use for pages with no layout given. By default, there is no default layout.
* `--ext`: By default when using `--dest-dir`, files are saved as '.html'. This option specifies another extension. This will be overridden if the file has an `ext` key in its YAML front matter.
* `--cwd`: When used in combination with `--dest-dir`, files will be saved relative to `--cwd`. For example, `--cwd=src/pages --dest-dir build` will save `src/pages/page.html` to `build/page.html`.

Complete option list:

````
    -H, --helper <file>          js file that exports an object containing handlebars helpers
    -p, --partial <file>         partial (globs are ok)
    -d, --data <data>            JSON, YAML or INI file or data (stdin with '-' or 'key:-')
    -t, --layout <file>          layout (template) file
    -y, --default-layout <name>  use this layout as default
    -o, --output <path>          output file
    -D, --dest-dir <path>        output directory (mandatory if more than one file given)
    -C, --cwd <path>             Saves files relative this directory
    -e, --ext <string>           output file extension (default: html)
    -v, --verbose                Output some debugging information
    -s, --silent                 Don't output anything
````

### Note

If you pass a glob to `--partial`, `--data`, `--layout` or `--helper`, make sure to enclose it in single quotes, or else your shell will expand it
````
$ taft --partial 'partials/*' source/page1.hbs
````
````
$ taft --data 'data/*.{yaml,json}' source/page1.hbs
````

The `--partial`, `--data`, `--layout`, and `--helper` options are repeatable:
````
$ taft --partial fun.hbs --partial cool.hbs source/page1.hbs
````
````
$ taft --data newt.ini --data 'frog-*.yaml' source/page1.hbs
````

## API

Taft is designed to use on the command line, but it has a simple API. Layouts, partials, helpers can be passed a list of files or globs, or a single filename as a string. Data files can be a list of files or javascript objects.
````javascript
Taft = require('taft');

var options = {
    layouts: ['layout.hbs']
    partials: 'layout.partial'
    data: [{"key": "foo"}, 'data.json'],
    helpers: 'helper.js',
    verbose: false // control the amount of logging to console
    silent: false
    defaultLayout: 'layout.hbs'
};
var taft = new Taft.Taft(options);

// returns a Content object, which is just a String
// that possibly has two properties:
// ext - the extension the file wants to have
// source - the path to the source file 

var result = taft.build('source/page1.hbs');
````

Taft also comes with chainable methods for adding layouts, helpers, data or partials. These can take the same arguments as the options. The above and below blocks of code are equivalent.

````javascript
var taft = new Taft.Taft()
    .layouts('layout.hbs')
    .helpers(['helpers.js'])
    .data([{"key": "foo"}, 'data.json'])
    .partials(['layout.partial'])
    .defaultLayout('layout.hbs');

var result = taft.build('source/page1.hbs');
````