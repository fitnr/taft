/*
 * taft: generate files with Handlebars
 * Copyright (C) 2016 Neil Freeman

 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.

 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.

 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/
/* jshint esversion: 6, node: true */

'use strict';

var glob = require('glob');

/**
 * merge the files in multiple globs into one list.
 * @param {Array} list mixed globs and file names
 * @return {Array} list of file names
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
    list = [].concat.apply([], list);

    // unique
    return list.filter(function(e, pos) {
        return list.indexOf(e) === pos;
    });
};