var glob = require('glob');

/**
 merge the files in multiple globs into one list.
*/
module.exports = function(list) {
    if (!Array.isArray(list))
        list = [list];

    // map globs to files, returning the glob if no file found
    list = list.map(function(item) {
        try {
            var globbed = glob.sync(item);
            return globbed.length ? globbed : item;
        } catch (_) {
            return item;
        }
    });

    // concat lists
    list = Array.prototype.concat.apply([], list);

    // unique
    return list.filter(function(e, pos) {
        return list.indexOf(e) === pos;
    });
}
