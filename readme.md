# Taft

Generate static html files from Handlebars files with YAML front matter.

Intended as a pandoc-like tool for building a simple page, or even for generating basic static websites, Taft is lightning fast and simple to use.


### Installing

Taft works great installed either locally or globally. If you're running a local copy, use `node_modules/.bin/taft`.

````
npm install [-g] taft
````

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
taft source/page1.hbs 
taft building source/page1.hbs
<p>The cauldron in my cavern is bubbling.</p>
<script src="magic-spells.js"></script>
````

By default, output goes to stdout and status messages output to stderr, so one can safely pipe the result.

Specify a single output file with `--output` or `-o`:
````
taft source/page1.hbs -o build/page1.html
build/page1.html
````

To generate more than one file, pass a destination directory.
````
taft source/page1.hbs source/page2.hbs 'other/*.hbs' --dest-dir build/
taft building source/page1.hbs
build/page1.html
taft building source/page2.hbs
build/page2.html
taft building other/more.hbs
build/more.html
````

Read from stdin by giving '-' as the file name.

````
cat source/page1.hbs | taft - > build/page1.html
````

#### Magic keys in your YAML front matter

Taft pays special attention to some keys in a page's YAML front matter: *ext*, *layout* and *published*. If `published: false`, then the page won't be built. Read on for details on the other two keys!

### Command line options

````
    -H, --helper <file>          js file that exports an object containing handlebars helpers
    -p, --partial <file>         Handlebars partial
    -d, --data <data>            JSON, YAML or INI file or data (stdin with '-' or 'key:-')
    -t, --layout <file>          Handlebars template file
    -y, --default-layout <name>  use this layout as default
    -o, --output <path>          output path
    -D, --dest-dir <path>        output directory (mandatory if more than one file given)
    -C, --cwd <path>             save files relative this directory
    -e, --ext <string>           output file extension (default: html)
    -v, --verbose                output some debugging information
    -s, --silent                 don't output anything
````

A quick run-down:

* `--default-layout`: The basename of the layout to use for pages with no layout given. By default, there is no default layout.
* `--ext`: By default when using `--dest-dir`, files are saved as '.html'. This option specifies another extension. This will be overridden if the file has an `ext` key in its YAML front matter.
* `--cwd`: When used in combination with `--dest-dir`, files will be saved relative to `--cwd`. For example, `--cwd=src/pages --dest-dir build` will save `src/pages/page.html` to `build/page.html`.

The following sections give details about the main options: `--data`, `--helper`, `--layout` and `--partial`. You'll find that a complex Taft command can get very long. That's OK! Use a Makefile to tract and reproduce commands.

### Layouts
Use a layout (aka template) to wrap a file with content. The layout should use the `{{> body}}` helper to refer to the content.

The YFM data from the content page will be available in the layout. If there's a conflict, use the 'page' object.
````handlebars
---
workplace: haunted wood
script: main.js
---
<p>Notes from the {{page.workplace}} and the {{workplace}}.</p>
{{> body}}
<script src="{{page.script}}"></script>
<script src="{{script}}"></script>
````
````
taft --layout layouts/template.hbs source/page1.hbs > build/page1.html
````
````html
<p>Notes from the cavern and the haunted wood.</p>
<p>The cauldron in my cavern is bubbling.</p>
<script src="magic-spells.js"></script>
<script src="main.js"></script>
````

````yaml
---
# source/page1.hbs
# The layout for this page will be 'layouts/default.hbs'.
title: My Favorite Encantations
---
Encantations...
````
````yaml
---
# source/page2.hbs
# The layout for this page will be 'layouts/potions.hbs'.
# Note that Taft allows you to just specify the base name of the file.
# Don't expect things to work correctly if you have two layouts with the same basename
title: Special Potions
layout: potions
---
Potions...
````
````yaml
---
# source/page3.hbs
# This page will be built without a layout.
layout: none
title: Super-Special Page
---
Special Stuff...
````

#### Default layouts

One can take advantage of a default layout one of three ways: Specify it explicity with the `--default-layout` option, Have a layout file named `default.*`, or only register one layout.

If you have a default layout but want to turn it off for a page, put `layout: false` in the YAML front matter.

````
taft --layout layouts/default.hbs --layout layouts/potions.hbs 
    source/page1.hbs source/page2.hbs source/page3.hbs -C _source -D build
````

### Partials
Taft will register partials from one or more files.

````
# Register the partial {{> fun}}
taft --partial partials/fun.hbs source/page1.hbs > build/page1.html
taft building source/page1.hbs

# Register the all the partials in partials/
taft --partial 'partials/*.hbs' source/page1.hbs > build/page1.html
taft building source/page1.hbs
````

### Helpers

Taft will register helpers for you. You pass it a file that `exports` a helper, or the name of a NPM helper module, Taft will register it to Handlebars.

````
taft --helper helpers/magic.js source/page1.hbs > build/page1.hbs
````
````
npm install -g handlebars-helper-minify
taft --helper handlebars-helper-minify source/page1.hbs > build/page1.hbs
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

Note that helpers must be installed in the same scope that you're running `Taft`. If you're using a global copy of taft, you'll need to install the helper globally. If you don't want to pollute the global space, or want to track everything, use a local copy of taft (`node_modules/.bin/taft`).

<!-- Taft comes packaged with the helpers in the [handlebars-helpers](https://github.com/assemble/handlebars-helpers) library. -->

### Data

Use the `--data` flag to specify sources of data for Taft to read in. Use INI, YAML, JSON, or YAML front matter files. Taft will read data from files, or from stdin input in those formats. Use '-' as the file name to read from stdin.

````
taft --data data/spooky.yaml source/page1.hbs > build/page1.hbs
echo '{"workplace": "haunted forest"}' | taft --data - source/page2.hbs > build/page2.hbs
````

In the first example above, data in the file `data/spooky.yaml` can be accessed via the object `{{spooky}}`.

Use globs to read in multiple data files at once. If the `data` directory contains `spooky.yaml` and `scary.yaml`:
````
taft --data data/*.yaml source/page.hbs > build/page.hbs
````
````handlebars
scary variable 'ghost': {{ spooky.ghost }}
scary variable 'monster': {{ scary.monster }}
````

You can even specify an INI/JSON/YAML string as the option to the `--data` flag. This isn't terribly useful, but it's a free side-effect of reading from stdin.
```
taft --data 'cool=true' source/page.hbs
taft --data '{"cool": true}' source/page.hbs
```

#### Data prefixes

Prefixes can be used to place data read from file globs or stdin in a named object. For example:

In this example, `{{laughs}}` will be a list containing "guffaw" and "cackle":
````
echo '["guffaw", "cackle"]' | taft --data laughs:- source/page.hbs > build/page.hbs
````
````handlebars
{{#laughs}}
    // do stuff
{{/laugh}}
````

Here, all of the files that match the pattern `data/cheer/*.yaml` will be placed in the list `{{cheer}}`:
````
taft --data 'cheer:data/cheer/*.yaml' source/index.hbs > build/page.hbs
````
If might be used like this:
````handlebars
{{#each cheer}}
    <li>{{title}}: {{description}}</li>
{{/cheer}}
````

Note that you cannot provide a prefix for a single file, or a JSON or YAML string passed to `--data`.

## Environment variables

The `taft` command line tool adds your environment variables to a variable called ENV.
```handlebars
{{#if ENV.DEVELOPMENT}}
The path is: {{ENV.PATH}}
{{/if}}
```
```
# Will print PATH
DEVELOPMENT=1 taft source/page.hbs
# Won't print the PATH
DEVELOPMENT= taft source/page.hbs
```

### About specifying files

If you pass a glob (a path with a wildcard) to `--partial`, `--data`, `--layout` or `--helper`, make sure to enclose it in single quotes, or else your shell will expand it, and Taft will interpret the files after the first one as pages.

````
taft --partial 'partials/*' source/page1.hbs
````
````
taft --data 'data/*.{yaml,json}' source/page1.hbs
````

The `--partial`, `--data`, `--layout`, and `--helper` options are repeatable:
````
taft --partial fun.hbs --partial cool.hbs source/page1.hbs
````
````
taft --data newt.ini --data 'frog-*.yaml' source/page1.hbs
````

## API

Taft is designed to use on the command line, but it has a simple API. Layouts, partials, helpers can be passed a list of files or globs, or a single filename as a string. Javascript objects are also acceptable for the data option.
````javascript
var Taft = require('taft');

var options = {
    layouts: ['layout.hbs']
    partials: 'layout.partial'
    data: [{"key": "foo"}, 'data.json'],
    helpers: 'helper.js',
    defaultLayout: 'layout.hbs'
};
var taft = new Taft(options);

// returns a Content object, which is just a String
// that possibly has two additional properties:
// ext - the extension the file wants to have
// source - the path to the source file 

var result = taft.build('source/page1.hbs');
````

Taft also comes with chainable methods for adding layouts, helpers, data or partials. These can take the same arguments as the options. The above and below blocks of code are equivalent.

````javascript
var taft = new Taft()
    .layouts('layout.hbs')
    .helpers(['helpers.js'])
    .data([{"key": "foo"}, 'data.json'])
    .partials(['layout.partial'])
    .defaultLayout('layout.hbs');

var result = taft.build('source/page1.hbs');
````

### Shorthand

For a super-quick build of a single file, use the `Taft.taft` method:

````javascript
var Taft = require('taft');

var options = {
    layouts: ['layout.hbs']
}

// returns a string containing the result
var result = Taft.taft('source/page1.handlebars', options);
````
