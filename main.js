const ob = require('obsidian')
, MERGE_UP_SIGNIFIER = '^'
, MERGE_LEFT_SIGNIFIER = '<'
, import_sheet = (app, ob)=> new class {
  trimLeading = line=> line.replace(/^.*?(?=(?<!\\)\|)/, '') // trim content before |
  rgxFindTable = (prev, textContent)=> {
    if (textContent[0].startsWith('```')) return // exclude codeblock
    // yes ? match ^| line : match not ^| line
    const fI = (arr, yes)=> arr.findIndex(i=> (yes ? /^\|/ : /^(?!\|)/).test(i))
    textContent.splice(0, fI(textContent, !0)); let endIndex = fI(textContent)
    while (endIndex > -1) {
      prev.r = textContent.splice(endIndex)
      endIndex = textContent[0].startsWith('|') ? -1 : fI(prev.r)
    }
  }
  source = []
  sheetview = (el, ctx)=> {
    const view = app.workspace.getActiveFileView(); if (!view) return
    const tableEls = Array.from(el.querySelectorAll('table')); if (tableEls.length < 1) return
    const prev = {}
    tableEls.map(async (tEl, tIndex)=> {
      const sec = ctx.getSectionInfo(tEl)
      if (!sec) {
        await new Promise(r=> setTimeout(r, 50))
        let source; const callout = tEl.offsetParent, { cmView } = callout
        // for source mode, table in callout
        if (cmView) {
          let textContent = prev.callout?.isEqualNode(callout)
            ? prev.r
            : cmView.widget.text.split('\n').map(line=> this.trimLeading(line))
          prev.callout = callout
          this.rgxFindTable(prev, textContent)
          source = textContent.join('\n')
        } else source = this.source[tIndex] // when export
        tEl.empty(); ctx.addChild(new this.SheetElement(app, tEl, source))
      // reading mode
      } else {
        let source; const { text, lineStart, lineEnd } = sec
        let textContent = (prev.t == text && prev.s == lineStart && prev.ed == lineEnd)
          ? prev.r // continue old one
          : text.split('\n').slice(lineStart, lineEnd+1).map(line=> this.trimLeading(line)) // get new one
        prev.t = text; prev.s = lineStart; prev.ed = lineEnd
        this.rgxFindTable(prev, textContent)
        source = textContent.join('\n')
        tEl.empty(); ctx.addChild(new this.SheetElement(app, tEl, source))
        this.source.push(source)
      }
    })
    if (view.getMode() == 'source') this.source = []
  }
  codesheet = (source, el, ctx)=> ctx.addChild(new this.SheetElement(app, el, source))
  SheetElement = class extends ob.MarkdownRenderChild {
    constructor(app, el, source) {
      super(el); Object.assign(this, {app, el})
      this.rowMaxLength = 0
      this.domGrid = []

      this.cellBorderRE = /(?<!\\)\|/
      this.headerRE = /^\s*?(:)?(?:-)+?(:)?\s*/
      this.contentGrid = source.split('\n').filter(row=> row).map(row=> row.split(this.cellBorderRE).slice(1, -1).map(cell=> cell.trim()))
    }
    onload() {
      this.normalizeGrid()
      this.el.id = 'obsidian-sheet'
      this.tableHead = this.el.createEl('thead')
      this.tableBody = this.el.createEl('tbody')
      this.headerRow = this.contentGrid.findIndex(row=> row.every(col=> this.headerRE.test(col)))
      if (this.headerRow !== -1) this.colStyles = this.getHeaderStyles(this.contentGrid[this.headerRow])
      this.buildDomTable()
    }
    onunload() {}
    normalizeGrid() {
      for (let rowIndex = 0; rowIndex < this.contentGrid.length; rowIndex++) {
        const rows = this.contentGrid[rowIndex]
        if (this.rowMaxLength < rows.length) this.rowMaxLength = rows.length
      }
      this.contentGrid = this.contentGrid.map(
        (line)=> Array.from(
          { ...line, length: this.rowMaxLength },
          cell=> cell || ''
        )
      )
    }

    getHeaderStyles(rowHeads) {
      return rowHeads.map(rowHead => {
        const alignment = rowHead.match(this.headerRE), styles = {}
        if (alignment[1] && alignment[2]) styles['textAlign'] = 'center'
        else if (alignment[1]) styles['textAlign'] = 'left'
        else if (alignment[2]) styles['textAlign'] = 'right'
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
        for (let columnIndex = 0; columnIndex < rows.length; columnIndex++)
          this.buildDomCell(rowIndex, columnIndex, rowNode)
      }
    }
    buildDomCell(rowIndex, columnIndex, rowNode) {
      if (rowIndex == this.headerRow) return
      let cellTag = 'td', cell, cellStyles
      if (rowIndex < this.headerRow) cellTag = 'th'
      const cellContent = this.contentGrid[rowIndex][columnIndex]
      if (cellContent == MERGE_LEFT_SIGNIFIER && columnIndex > 0) {
        cell = this.domGrid[rowIndex][columnIndex - 1]
        cell?.colSpan || Object.assign(cell, { colSpan: 1 })
        cell.colSpan += 1
      } else if (cellContent == MERGE_UP_SIGNIFIER && rowIndex > 0) {
        cell = this.domGrid[rowIndex - 1][columnIndex]
        cell?.rowSpan || Object.assign(cell, { rowSpan: 1 })
        cell.rowSpan += 1
      } else {
        cell = rowNode.createEl(cellTag)
        ob.MarkdownRenderer.render(this.app, `\u200B ${cellContent||'\u200B'}`, cell, '', this)
          .then(()=> cell.innerHTML = cell.children[0].innerHTML.replace(/^\u200B /g, ''))
      }
      if (this.colStyles?.[columnIndex]) {
        cellStyles = { ...cellStyles, ...this.colStyles[columnIndex].styles }
      }
      Object.assign(cell.style, cellStyles)
      return this.domGrid[rowIndex][columnIndex] = cell
    }
  }
}
, { sheetview, codesheet } = import_sheet(this.app, ob)
module.exports = class extends ob.Plugin {
  onload() {
    this.registerMarkdownPostProcessor(sheetview)
    this.registerMarkdownCodeBlockProcessor('sheet', codesheet)
  }
  onunload() {}
}
