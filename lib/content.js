#!/usr/bin/env node

'use strict';

function Content(content, data) {
    this._content = content || '';
    this.data = data || {};
    return this;
}

Content.prototype.toString = function() {
  return this._content;
};

module.exports = Content;
