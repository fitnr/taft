# Taft

Generate static html files from Handlebars files with YAML front matter.

Intended as a pandoc-like tool for building a simple page, or even for generating basic static websites.

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

Note that the status message outputs to stderr, so One can safely pipe the result.

To generate more than one file, just pass a destination directory.

````=
$ taft source/page1.hbs source/page2.hbs other/*.hbs --dest-dir build/
taft building source/page1.hbs
build/page1.html
taft building source/page2.hbs
build/page2.html
taft building other/more.hbs
build/more.html
````

Specifying a single output file with `--output`:
````=
$ taft source/page1.hbs -o build/page1.html
build/page1.html
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

````==
$ taft --layout layouts/template.hbs source/page1.hbs > build/page1.html
````

````html
<p>Notes from the cavern and the haunted wood.</p>
<p>The cauldron in my cavern is bubbling.</p>
<script src="magic-spells.js"></script>
<script src="main.js"></script>
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

Taft will register helpers for you. You pass it a file that `exports` a helper, Taft will register it to Handlebars.

````
$ taft --helper helpers/magic.js source/page1.hbs > build/page1.hbs
````

You can export the helper either as a function, or as an object containing several functions. In the former format, the name of the file becomes the helper. In the latter format, the key of each function is the name of the helper.

````javascript
// magic.js
// This will be available in Handlebars as '{{magic}}'

module.exports = function() { /* do stuff */ };
````

````javascript
// These will be available in Handlebars as '{{whiteMagic}} and {{blackMagic}},
// regardless of the file name'

// Use your favorite node module
var spells = require('spells');

module.exports = {
    whiteMagic: function() { /* do stuff */ },

    blackMagic function() { /* do bad stuff */ }
};
````

Taft comes packaged with the helpers in the [handlebars-helpers](https://github.com/assemble/handlebars-helpers) library.

### Data

In addition to the YAML front matter in layouts and pages, Taft will read data from YAML or JSON files, or from stdin. Use '-' as the file name to read from stdin.

````
$ taft --data data/data.yaml source/page1.hbs > build/page1.hbs
$ echo '{"workplace": "haunted forest"}' | taft --data - source/page2.hbs > build/page2.hbs
````

### Other options

* `--ext`: By default when using `--dest-dir`, files are saved as '.html'. This option specifies another extension.

Complete option list:

````
    -t, --layout <file>    layout (template) file
    -H, --helper <file>    js file that exports an object containing handlebars helpers
    -p, --partial <file>   partials (basename of file is partial name)
    -d, --data <data>      JSON or YAML data.
    -o, --output <path>    output file
    -D, --dest-dir <path>  output directory (mandatory if more than one file given)
    -e, --ext <string>     output file extension (default: html)
    -v, --verbose          Output some debugging information
    -q, --quiet            Don't output progress
````

### Note

If you pass a glob to `--partial` or `--helper`, make sure to enclose it in single quotes, or else your shell will expand it
````
$ taft --partial 'partials/*' source/page1.hbs
````

Both `--partial` and `--helper` are repeatable:
````
$ taft --partial partials/fun.hbs --partial partials/cool.hbs source/page1.hbs
````
