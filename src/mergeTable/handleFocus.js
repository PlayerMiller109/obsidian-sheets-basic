const { isSign } = require('../utils.js')
const handleFocus = table=> {
  const _old = table.receiveCellFocus
  table.receiveCellFocus = function(row, col, func, flag) {
    if (table.rows[row]?.[col]?.el.style.display == 'none') {
      const { cell } = table.editor.tableCell
      , { row: maxRow, col: maxCol } = table.rows.flat().pop()
      if (row === cell.row) {
        while (isSign(table.rows[row]?.[col]?.text))
          col += col < cell.col ? -1 : 1
        if (col < 0) {
          while (isSign(table.rows[row]?.[0].text)) row--
        }
        if (col > maxCol) {
          col = 0; row++
          if (row > maxRow) table.insertRow(row, col)
        }
      }
      else if (col === cell.col) {
        while (isSign(table.rows[row]?.[col]?.text))
          row += row < cell.row ? -1 : 1
        if (row < 0) {
          while (isSign(table.rows[0][col]?.text)) col--
        }
      }
      else {
        if (row === cell.row - 1) {
          while (isSign(table.rows[row][col]?.text)) col--
        }
        if (row === cell.row + 1) {
          while (isSign(table.rows[row][col]?.text)) col++
        }
      }
    }
    _old.call(this, row, col, func, flag)
  }
}
module.exports = handleFocus