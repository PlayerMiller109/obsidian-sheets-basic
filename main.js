const ob = require('obsidian'), { ViewPlugin } = require('@codemirror/view')
, mergeUp_Sign = '^', mergeLeft_Sign = '<', tableId = 'obsidian-sheet'
, import_sheet = ({app, ob, ViewPlugin})=> {
  class liveParser {
    update(update) {
      const a1 = app.workspace.getActiveFileView()?.currentMode; if (!a1) return
      const undo = update.transactions.find(tr=> tr.isUserEvent('undo')), { tableCell } = a1
      // when cursor in table you can get tableCell
      // table.render() is an Ob prototype, you can use table.rebuildTable() too
      if (undo && tableCell) { tableCell.table.render(); mergeTable(tableCell.table) }
      const { view } = update; if (update.focusChanged && view.hasFocus) setTimeout(()=> mergeAllInView(view))
    }
  }
  const postParser = new class {
    source = []
    main = (el, ctx)=> {
      const view5 = app.workspace.getActiveFileView(); if (!view5) return
      const tableEls = Array.from(el.querySelectorAll('table')); if (tableEls.length < 1) return
      const prev = {}
      tableEls.map(async (tEl, tIndex)=> {
        let source; const sec = ctx.getSectionInfo(tEl)
        if (!sec) {
          await new Promise(r=> setTimeout(r, 50))
          const callout = tEl.offsetParent
          if (callout?.cmView) { // for source mode, assume table is in callout
            let rowSources
            if (prev.callout?.isEqualNode(callout)) rowSources = prev.r;
            else {
              const a1 = callout.cmView.widget.text; if (!a1) return // table in Dataview
              rowSources = a1.split('\n').map(line=> trimLeading(line))
            }
            prev.callout = callout
            rgxFindTable(prev, rowSources)
            source = rowSources.join('\n')
          } else source = this.source[tIndex] // when export
        // reading mode
        } else {
          const { text, lineStart, lineEnd } = sec; let rowSources
          if (prev.t == text && prev.s == lineStart && prev.ed == lineEnd) rowSources = prev.r; // continue old one
          else rowSources = text.split('\n').slice(lineStart, lineEnd+1).map(line=> trimLeading(line)) // get new one
          prev.t = text; prev.s = lineStart; prev.ed = lineEnd
          rgxFindTable(prev, rowSources)
          source = rowSources.join('\n')
          this.source.push(source)
        }
        if (!source) return; tEl.empty(); ctx.addChild(new SheetElement(tEl, source))
      })
    }
  }
  const blockParser = (source, el, ctx)=> source && ctx.addChild(new SheetElement(el, source))
  class SheetElement extends ob.MarkdownRenderChild {
    constructor(el, source) {
      super(el); el.id = tableId; this.tableHead = el.createEl('thead'); this.tableBody = el.createEl('tbody')
      this.contentGrid = source.split('\n').filter(row=> row).map(row=> row.split(this.cellBorderRE).slice(1, -1).map(cell=> cell.trim()))
    }
    cellBorderRE = /(?<!\\)\|/
    headerRE = /^\s*?(:)?(?:-)+?(:)?\s*/
    rowMaxLength = 0; domGrid = []
    onload() {
      this.normalizeGrid()
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
      this.contentGrid = this.contentGrid.map(line=> Array.from(
        { ...line, length: this.rowMaxLength }, cell=> cell || ''
      ))
    }

    getHeaderStyles(heads) {
      return heads.map(head=> {
        const alignment = head.match(this.headerRE), styles = {}
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
        for (let colIndex = 0; colIndex < rows.length; colIndex++)
          this.buildDomCell(rowIndex, colIndex, rowNode)
      }
    }
    buildDomCell(rowIndex, colIndex, rowNode) {
      if (rowIndex == this.headerRow) return
      let cellTag = 'td', cell, cellStyles
      if (rowIndex < this.headerRow) cellTag = 'th'
      const cellContent = this.contentGrid[rowIndex][colIndex]
      if (cellContent == mergeLeft_Sign && colIndex > 0) {
        cell = this.domGrid[rowIndex][colIndex - 1]
        cell.colSpan || Object.assign(cell, { colSpan: 1 })
        cell.colSpan += 1
      } else if (cellContent == mergeUp_Sign && rowIndex > 0) {
        cell = this.domGrid[rowIndex - 1][colIndex]
        cell.rowSpan || Object.assign(cell, { rowSpan: 1 })
        if (rowIndex - 1 > cell.rowSpan) cell.rowSpan += 1
      } else {
        cell = rowNode.createEl(cellTag)
        ob.MarkdownRenderer.render(app, `\u200B ${cellContent||'\u200B'}`, cell, '', this)
          .then(()=> cell.innerHTML = cell.children[0].innerHTML.replace(/^\u200B /g, ''))
      }
      if (this.colStyles?.[colIndex]) {
        cellStyles = { ...cellStyles, ...this.colStyles[colIndex].styles }
      }
      Object.assign(cell.style, cellStyles)
      return this.domGrid[rowIndex][colIndex] = cell
    }
  }
  return function() {
    this.registerMarkdownPostProcessor(postParser.main)
    this.registerMarkdownCodeBlockProcessor('sheet', blockParser)
    this.registerEvent(
      app.workspace.on('file-open', ()=> {
        postParser.source = []
        const view = app.workspace.getActiveFileView()?.currentMode?.cm
        if (view) setTimeout(()=> mergeAllInView(view), 50)
      }),
    )
    this.addCommand({
      id: 'rebuild', name: 'rebuildCurrent',
      editorCallback: async (_, view5)=> {
        const { tableCell } = view5.currentMode
        if (tableCell) {
          const checking = unmergeCell(tableCell)
          if (!checking) mergeTable(tableCell.table)
        } else await view5.leaf.rebuildView()
        postParser.source = []
      },
      hotkeys: [{modifiers: [], key: 'F5'}]
    })
    this.registerEditorExtension([ViewPlugin.fromClass(liveParser)])
  }
}
module.exports = class extends ob.Plugin {
  onload() {
    import_sheet({app: this.app, ob, ViewPlugin}).call(this)
  }
  onunload() {}
}
const mergeTable = table=> {
  const cells = table.rows.flat(); let cellEl
  for (const cell of cells) {
    if (cell.el.id == tableId) continue; let i = 1
    if (cell.text == mergeLeft_Sign && cell.col > 0) {
      cell.el.id = tableId; cell.el.style = 'display: none;'
      do {
        cellEl = cells.find(cell2=> cell2.row == cell.row && cell2.col == cell.col - i)?.el
        if (!cellEl) break; i++
      } while (cellEl.id == tableId); if (!cellEl) continue
      cellEl.colSpan || Object.assgin(cellEl, { colSpan: 1 })
      cellEl.colSpan += 1
    } else if (cell.text == mergeUp_Sign && cell.row > 0) {
      cell.el.id = tableId; cell.el.style = 'display: none;'
      do {
        cellEl = cells.find(cell2=> cell2.row == cell.row - i && cell2.col == cell.col)?.el
        if (!cellEl) break; i++
      } while (cellEl.id == tableId); if (!cellEl) continue
      cellEl.rowSpan || Object.assign(cellEl, { rowSpan: 1 })
      cellEl.rowSpan += 1
    }
  }
}
, mergeAllInView = view=> view.docView.children.flatMap(c=> c.dom.className.includes('table-widget') ? c.widget : []).map(mergeTable)
, unmergeCell = tableCell=> {
  const { cell, table } = tableCell, { row, col } = cell, cells = table.rows.flat(), cellEl = cell.el
  if (cellEl.rowSpan > 1 || cellEl.colSpan > 1) {
    cells.filter(cell2=>
      row <= cell2.row && cell2.row < row + cellEl.rowSpan && col <= cell2.col && cell2.col < col + cellEl.colSpan
    ).map(cell2=> { cell2.el.removeAttribute('id'); cell2.el.style = 'display: table-cell;' })
    cellEl.colSpan = 1; cellEl.rowSpan = 1; return !0
  }
}
, trimLeading = line=> line.replace(/^.*?(?=(?<!\\)\|)/, '') // trim content before |
, rgxFindTable = (prev, textContent)=> {
  if (textContent[0].startsWith('```')) return // exclude codeblock
  // yes ? match ^| line : match not ^| line
  const fI = (arr, yes)=> arr.findIndex(i=> (yes ? /^\|/ : /^(?!\|)/).test(i))
  textContent.splice(0, fI(textContent, !0)); let endIndex = fI(textContent)
  while (endIndex > -1) {
    prev.r = textContent.splice(endIndex)
    endIndex = textContent[0].startsWith('|') ? -1 : fI(prev.r)
  }
}