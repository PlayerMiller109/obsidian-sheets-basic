const ob = require('obsidian'), { ViewPlugin } = require('@codemirror/view')
module.exports = class extends ob.Plugin {
  onload() {
    const sheet = require('./src/sheet.js')(this.app, {ob, ViewPlugin})
    sheet.call(this)
  }
}