#!/usr/bin/env node

'use strict';

/**
 * A Content object is basically a string with a data object attached.
 * @constructor
 * @this {Content}
 */
function Content(content, data) {
    this._content = content || '';
    this.data = data || {};
    return this;
}

Content.prototype.toString = function() {
  return this._content;
};

module.exports = Content;
