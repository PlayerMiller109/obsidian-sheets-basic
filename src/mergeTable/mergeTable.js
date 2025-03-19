const { merge } = require('../utils.js')
const handleFocus = require('./handleFocus.js')
const mergeTable = table=> {
  const cells = table.rows.flat()
  for (const _cell of cells) merge(_cell, cells)
  handleFocus(table)
}
const mergeAllInView = view=> view.docView.children.flatMap(c=>
  c.dom.className.includes('table-widget') ? c.widget : []
).map(mergeTable)
module.exports = { mergeTable, mergeAllInView }