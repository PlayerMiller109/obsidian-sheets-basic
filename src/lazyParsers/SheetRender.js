const { tableId, merge } = require('../utils.js')
const FootMgr = require('./FootMgr.js')
module.exports = (app, ob)=> class extends ob.MarkdownRenderChild {
  constructor(el, source) {
    super(el)
    this.buildContGrid(source)
    const tableEl = el
    tableEl.id = tableId
    this.domGrid = Array.from(tableEl.rows).map((tr, rowIndex)=> {
      return Array.from(tr.cells).map((td, colIndex)=> ({
        el: td, row: rowIndex, col: colIndex,
        text: this.contGrid[rowIndex][colIndex],
      }))
    })
    this.buildDomTable()
  }
  onload() {}
  onunload() {}

  cellBorderRE = /(?<!\\)\|/
  headerRE = /^\s*?(\:)?(?:-+)(\:)?\s*/
  buildContGrid(source) {
    this.contGrid = source.split('\n').filter(row=> row).map(
      row=> row.split(this.cellBorderRE).slice(1, -1).map(cell=> cell.trim())
    )
    this.headerRow = this.contGrid.findIndex(
      row=> row.every(col=> this.headerRE.test(col))
    )
    this.contGrid.splice(this.headerRow, 1)
  }
  buildDomTable() {
    const cells = this.domGrid.flat()
    for (const _cell of cells) {
      const merged = merge(_cell, cells)
      if (!merged) this.normalizeCell(_cell)
    }
  }
  normalizeCell({text, el}) {
    const footMgr = new FootMgr()
    text = text.replaceAll('<br>', '\n')
    text = footMgr.dummy(text)
    footMgr.retain(el)
    el.empty()
    ob.MarkdownRenderer.render(
      app, text||'\u200B', el, '', this
    ).then(()=> this.afterRender(el, footMgr))
  }
  afterRender = (cellEl, footMgr)=> {
    footMgr.handleInline(cellEl)
    const isP = el=> el.tagName == 'P';
    [cellEl.firstChild, cellEl.lastChild].map(el=> {
      if (!isP(el)) return
      if (!el.textContent && !el.children[0])
        el.remove()
    })
    let _ihtml = ''
    for (const node of cellEl.childNodes) {
      if (node.nodeType === 3) {
        _ihtml += (node.data === '\n') ? '<br><br>' : node.data
      }
      else _ihtml += isP(node) ? node.innerHTML : node.outerHTML
    }
    _ihtml = footMgr.restore(_ihtml)
    cellEl.innerHTML = _ihtml
  }
}