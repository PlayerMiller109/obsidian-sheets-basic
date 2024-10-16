const Sign = {up: '^', left: '<'}, tableId = 'obsidian-sheet'
const import_lazyParsers = (app, ob)=> {
  class SheetElement extends ob.MarkdownRenderChild {
    constructor(el, source, isBlock) {
      super(el)
      const tableEl = isBlock ? el.createEl('table') : el
      tableEl.id = tableId
      this.tableHead = tableEl.createEl('thead')
      this.tableBody = tableEl.createEl('tbody')
      this.contentGrid = source.split('\n').filter(row=> row).map(row=>
        row.split(this.cellBorderRE).slice(1, -1).map(cell=> cell.trim())
      )
    }
    cellBorderRE = /(?<!\\)\|/
    headerRE = /^\s*?(:)?(?:-)+?(:)?\s*/
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
      if (cellContent == Sign.left && colIndex > 0) {
        cell = this.domGrid[rowIndex][colIndex - 1]
        cell.colSpan || Object.assign(cell, { colSpan: 1 })
        cell.colSpan += 1
      } else if (cellContent == Sign.up && rowIndex > 0) {
        cell = this.domGrid[rowIndex - 1][colIndex]
        cell.rowSpan || Object.assign(cell, { rowSpan: 1 })
        if (rowIndex - 1 > cell.rowSpan) cell.rowSpan += 1
      } else {
        cell = rowNode.createEl(cellTag)
        ob.MarkdownRenderer.render(
          app, cellContent||'\u200B', cell, '', this
        ).then(()=> {
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
          cell.innerHTML = _ihtml
        })
      }
      if (this.colStyles?.[colIndex]) {
        cellStyles = { ...cellStyles, ...this.colStyles[colIndex].styles }
      }
      Object.assign(cell.style, cellStyles)
      return this.domGrid[rowIndex][colIndex] = cell
    }
  }
  // trim content before |
  const trimLeading = line=> line.replace(/^.*?(?=(?<!\\)\|)/, '')
  // yes ? match ^| line : match not ^| line
  const fI = (arr, yes)=> arr.findIndex(i=> (yes ? /^\|/ : /^(?!\|)/).test(i))
  const rgxFindTable = (prev, rowSources)=> {
    if (rowSources[0].startsWith('```')) return // exclude codeblock
    rowSources.splice(0, fI(rowSources, !0))
    let endIndex = fI(rowSources)
    while (endIndex > -1) {
      prev.r = rowSources.splice(endIndex)
      endIndex = rowSources[0].startsWith('|') ? -1 : fI(prev.r)
    }
  }
  const postParser = new class {
    source = []
    main = (el, ctx)=> {
      const view5 = app.workspace.getActiveFileView(); if (!view5) return
      const tableEls = Array.from(el.querySelectorAll('table')); if (!tableEls[0]) return
      const prev = {}
      tableEls.map(async (tEl, tIndex)=> {
        let source; const sec = ctx.getSectionInfo(tEl)
        if (!sec) {
          await new Promise(r=> setTimeout(r, 50))
          const callout = tEl.offsetParent
          if (callout?.cmView) { // for source mode, assume table is in callout
            let rowSources
            if (prev.callout === callout) rowSources = prev.r;
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
  return {
    postParser,
    blockParser: (source, el, ctx)=> source && ctx.addChild(new SheetElement(el, source, !0))
  }
}
const import_sheet = (app, {ob, ViewPlugin})=> {
  const getCMode = ()=> app.workspace.getActiveFileView()?.currentMode
  , isSign = text=> Object.values(Sign).includes(text)
  , handleFocus = table=> {
    const old = table.receiveCellFocus
    table.receiveCellFocus = function(row, col, func, flag) {
      if (table.rows[row]?.[col]?.el.style.display == 'none') {
        const { tableCell } = getCMode()
        if (tableCell) {
          const { cell } = tableCell
          if (row === cell.row) {
            while (isSign(table.rows[row]?.[col]?.text))
              col += col < cell.col ? -1 : 1
            if (col < 0) {
              while (isSign(table.rows[row]?.[0].text)) row--
            }
          } else if (col === cell.col) {
            while (isSign(table.rows[row]?.[col]?.text))
              row += row < cell.row ? -1 : 1
            if (row < 0) {
              while (isSign(table.rows[0][col]?.text)) col--
            }
          }
        }
      }
      old.call(this, row, col, func, flag)
    }
  }
  , disable = cell=> { cell.el.id = tableId; cell.el.style.display = 'none' }
  , mergeTable = table=> {
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
      } else if (_cell.text == Sign.up && _cell.row > 0) {
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
  , mergeAllInView = view=> view.docView.children.flatMap(c=>
    c.dom.className.includes('table-widget') ? c.widget : []
  ).map(mergeTable)
  , unmergeCell = tableCell=> {
    const { table, cell } = tableCell
    , cells = table.rows.flat(), { row, col, el: cellEl } = cell
    if (cellEl.rowSpan > 1 || cellEl.colSpan > 1) {
      cells.filter(cell2=>
        row <= cell2.row && cell2.row < row + cellEl.rowSpan
        && col <= cell2.col && cell2.col < col + cellEl.colSpan
      ).map(cell2=> {
        cell2.el.removeAttribute('id')
        cell2.el.style.display = 'table-cell'
      })
      cellEl.colSpan = cellEl.rowSpan = 1; return !0
    }
  }
  class liveParser {
    update(update) {
      const a1 = app.workspace.getActiveFileView()?.currentMode; if (!a1) return
      const undo = update.transactions.find(tr=> tr.isUserEvent('undo'))
      , { tableCell } = a1
      // when cursor in table you can get tableCell
      // table.render() is an Ob prototype, you can use table.rebuildTable() too
      if (undo && tableCell) { tableCell.table.render(); mergeTable(tableCell.table) }
      const { view } = update
      if (
        update.focusChanged && view.hasFocus
        || update.viewportChanged
      ) setTimeout(()=> mergeAllInView(view))
    }
  }
  const { postParser, blockParser } = import_lazyParsers(app, ob)
  const updateMerge = ()=> {
    postParser.source = []
    const cMode = getCMode(); if (!cMode) return
    const view = cMode.cm
    if (view) setTimeout(()=> mergeAllInView(view), 50)
  }
  return function() {
    this.registerMarkdownPostProcessor(postParser.main)
    this.registerMarkdownCodeBlockProcessor('sheet', blockParser)
    this.registerEvent(app.workspace.on('file-open', updateMerge))
    app.workspace.onLayoutReady(updateMerge)
    this.addCommand({
      id: 'rebuild', name: 'rebuildCurrent',
      callback: async ()=> {
        postParser.source = []
        const cMode = getCMode(); if (!cMode) return
        const { tableCell } = cMode
        if (tableCell) {
          const checking = unmergeCell(tableCell)
          if (!checking) mergeTable(tableCell.table)
        } else {
          const leaves = app.workspace.getLeavesOfType('markdown')
            .filter(leaf=> leaf.view.path == cMode.path)
          for (const leaf of leaves) await leaf.rebuildView()
        }
      },
      hotkeys: [{modifiers: [], key: 'F5'}]
    })
    this.registerEditorExtension([ViewPlugin.fromClass(liveParser)])
  }
}
const ob = require('obsidian'), { ViewPlugin } = require('@codemirror/view')
module.exports = class extends ob.Plugin {
  onload() {
    import_sheet(this.app, {ob, ViewPlugin}).call(this)
  }
  onunload() {}
}