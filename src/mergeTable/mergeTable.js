const { Sign, tableId } = require('../Sign.js')
const disable = cell=> { cell.el.id = tableId; cell.el.style.display = 'none' }
const handleFocus = require('./handleFocus.js')
const mergeTable = table=> {
  const cells = table.rows.flat(); let cell
  for (const _cell of cells) {
    if (_cell.el.id == tableId) continue; let i = 1, breaked = !1
    if (_cell.text == Sign.left && _cell.col > 0) {
      disable(_cell)
      do {
        cell = cells.find(cell2=> cell2.row == _cell.row && cell2.col == _cell.col - i)
        if (!cell || cell.text == Sign.up) { breaked = !0; break }; i++
      } while (cell.el.id == tableId); if (breaked) continue
      const { el: cellEl } = cell
      cellEl.colSpan || Object.assgin(cellEl, { colSpan: 1 })
      cellEl.colSpan += 1
    }
    else if (_cell.text == Sign.up && _cell.row > 0) {
      disable(_cell)
      do {
        cell = cells.find(cell2=> cell2.row == _cell.row - i && cell2.col == _cell.col)
        if (!cell) { breaked = !0; break }; i++
      } while (cell.el.id == tableId); if (breaked) continue
      const { el: cellEl } = cell
      cellEl.rowSpan || Object.assign(cellEl, { rowSpan: 1 })
      cellEl.rowSpan += 1
    }
  }
  handleFocus(table)
}
const mergeAllInView = view=> view.docView.children.flatMap(c=>
  c.dom.className.includes('table-widget') ? c.widget : []
).map(mergeTable)
module.exports = { mergeTable, mergeAllInView }