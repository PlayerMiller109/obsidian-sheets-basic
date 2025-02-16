const { Sign, tableId } = require('../Sign.js')
module.exports = (app, ob)=> class extends ob.MarkdownRenderChild {
  constructor(el, source, isBlock) {
    super(el)
    this.footMgr.retain(el)
    el.empty()
    const tableEl = isBlock ? el.createEl('table') : el
    tableEl.id = tableId
    this.tableHead = tableEl.createEl('thead')
    this.tableBody = tableEl.createEl('tbody')
    this.contentGrid = source.split('\n').filter(row=> row).map(row=>
      row.split(this.cellBorderRE).slice(1, -1).map(cell=> cell.trim())
    )
  }
  cellBorderRE = /(?<!\\)\|/
  headerRE = /^\s*?(\:)?(?:-+)(\:)?\s*/
  rowMaxLength = 0; domGrid = []
  onload() {
    this.normalizeGrid()
    this.headerRow = this.contentGrid.findIndex(row=> row.every(col=> this.headerRE.test(col)))
    if (this.headerRow !== -1)
      this.colStyles = this.getHeaderStyles(this.contentGrid[this.headerRow])
    this.buildDomTable()
  }
  onunload() {}

  normalizeGrid() {
    for (let rowIndex = 0; rowIndex < this.contentGrid.length; rowIndex++) {
      const rows = this.contentGrid[rowIndex]
      if (this.rowMaxLength < rows.length) this.rowMaxLength = rows.length
    }
    this.contentGrid = this.contentGrid.map(line=> Array.from(
      { ...line, length: this.rowMaxLength }, cell=> cell || ''
    ))
  }

  getHeaderStyles(heads) {
    return heads.map(head=> {
      const alignment = head.match(this.headerRE), styles = {}
      if (alignment[1] && alignment[2]) styles['textAlign'] = 'center';
      else if (alignment[1]) styles['textAlign'] = 'left';
      else if (alignment[2]) styles['textAlign'] = 'right';
      return { styles }
    })
  }

  buildDomTable() {
    for (let rowIndex = 0; rowIndex < this.contentGrid.length; rowIndex++) {
      if (rowIndex == this.headerRow) continue
      let rowNode = this.tableBody.createEl('tr')
      if (rowIndex < this.headerRow) rowNode = this.tableHead.createEl('tr')
      this.domGrid[rowIndex] = []
      const rows = this.contentGrid[rowIndex]
      for (let colIndex = 0; colIndex < rows.length; colIndex++)
        this.buildDomCell(rowIndex, colIndex, rowNode)
    }
  }
  footMgr = new class {
    retain = (el)=> {
      const footEls = el.querySelectorAll('.footnote-ref')
      this.footrefs = Array.from(footEls).map(el=> ({
        cont: el.children[0].dataset.footref,
        html: el.outerHTML,
      }))
    }
    dummy = (text)=> {
      return text.replaceAll(/(?<!\\)\[\^(.+?)\]/g, `↿$1↿`)
    }
    restore = (text)=> {
      return text.replaceAll(
        /↿(.+?)↿/g, (m, p1)=> {
          const ref = this.footrefs.find(ref=> ref.cont === p1)
          return ref ? ref.html : p1
        }
      )
    }
  }
  normalizeCell(text, cell) {
    text = text.replaceAll('<br>', '\n')
    text = this.footMgr.dummy(text)
    const afterRender = (cell)=> {
      const isP = el=> el.tagName == 'P';
      [cell.firstChild, cell.lastChild].map(el=> {
        if (!isP(el)) return
        if (!el.textContent && !el.children[0])
          el.remove()
      })
      let _ihtml = ''
      for (const node of cell.childNodes) {
        if (node.nodeType === 3) _ihtml += node.data;
        else _ihtml += isP(node) ? node.innerHTML : node.outerHTML
      }
      _ihtml = this.footMgr.restore(_ihtml)
      cell.innerHTML = _ihtml
    }
    ob.MarkdownRenderer.render(
      app, text||'\u200B', cell, '', this
    ).then(()=> afterRender(cell))
  }
  buildDomCell(rowIndex, colIndex, rowNode) {
    if (rowIndex == this.headerRow) return
    let cellTag = 'td', cell, cellStyles
    if (rowIndex < this.headerRow) cellTag = 'th'

    let cellText = this.contentGrid[rowIndex][colIndex]
    if (cellText == Sign.left && colIndex > 0) {
      cell = this.domGrid[rowIndex][colIndex - 1]
      cell.colSpan || Object.assign(cell, { colSpan: 1 })
      cell.colSpan += 1
    }
    else if (cellText == Sign.up && rowIndex > 0) {
      cell = this.domGrid[rowIndex - 1][colIndex]
      cell.rowSpan || Object.assign(cell, { rowSpan: 1 })
      if (rowIndex - 1 > cell.rowSpan) cell.rowSpan += 1
    }
    else {
      cell = rowNode.createEl(cellTag)
      this.normalizeCell(cellText, cell)
    }
    if (this.colStyles?.[colIndex]) {
      cellStyles = { ...cellStyles, ...this.colStyles[colIndex].styles }
    }
    Object.assign(cell.style, cellStyles)
    return this.domGrid[rowIndex][colIndex] = cell
  }
}