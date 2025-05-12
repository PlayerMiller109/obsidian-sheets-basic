const Sign = {up: '^', left: '<'}
const cellId = 'm-sheet-cell'
const disable = el=> { el.id = cellId; el.style.display = 'none' }
module.exports = new class {
  tableId = 'm-sheet'
  isSign = text=> Object.values(Sign).includes(text)
  merge = (_cell, cells)=> {
    if (_cell.el.id == cellId) return
    let i = 1, params
    if (_cell.text == Sign.left && _cell.col > 0)
      params = {
        find: cell2=> cell2.row == _cell.row && cell2.col == _cell.col - i,
        stop: Sign.up, type: 'colSpan',
      }
    else if (_cell.text == Sign.up && _cell.row > 0)
      params = {
        find: cell2=> cell2.row == _cell.row - i && cell2.col == _cell.col,
        stop: Sign.left, type: 'rowSpan',
      }
    else return
    disable(_cell.el)
    const { find, stop, type } = params
    let cell, broke
    do {
      cell = cells.find(find)
      if (!cell || cell.text == stop) { broke = !0; break }
      i++
    } while (cell.el.id == cellId); if (broke) return
    const { el: cellEl } = cell
    cellEl[type] || Object.assgin(cellEl, { [type]: 1 })
    cellEl[type] += 1
    return !0
  }
}