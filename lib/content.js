#!/usr/bin/env node

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

'use strict';

var trailing = new RegExp(/[ \t]+$/, 'gm');

/**
 * A Content object is basically a string with a data object attached.
 * Trailing whitespace is removed from each line.
 * @constructor
 * @this {Content}
 */
function Content(content, data) {
    this._content = (content || '').replace(trailing, '');
    this.data = data || {};
    return this;
}

Content.prototype.toString = function() {
  return this._content;
};

module.exports = Content;
