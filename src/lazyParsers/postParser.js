const { trimLeading, rgxFindTable } = require('./buildContGrid.js')
module.exports = (app, ob)=> {
  const SheetRender = require('./SheetRender.js')(app, ob)
  return postParser = new class {
    grid = []
    main = (el, ctx)=> {
      if (el.hasClass('block-language-sheet')) return
      const view5 = app.workspace.getActiveFileView(); if (!view5) return
      const tableEls = Array.from(el.querySelectorAll('table')); if (!tableEls[0]) return
      const prev = {}
      tableEls.map(async (tEl, tIndex)=> {
        let grid; const sec = ctx.getSectionInfo(tEl)
        if (!sec) {
          await sleep(50)
          const callout = tEl.offsetParent
          if (callout?.cmView) { // for source mode, assume table is in callout
            let rowSources
            if (prev.callout === callout) rowSources = prev.r;
            else {
              const a1 = callout.cmView.widget.text; if (!a1) return // table in Dataview
              rowSources = a1.split('\n').map(line=> trimLeading(line))
            }
            prev.callout = callout
            grid = rgxFindTable(prev, rowSources)
          }
          else {
            grid = this.grid[tIndex] // when export
            // if (grid && el.className == 'slides') return
          }
        }
        // reading mode
        else {
          const { text, lineStart, lineEnd } = sec; let rowSources
          if (
            prev.t == text && prev.s == lineStart && prev.ed == lineEnd
          ) rowSources = prev.r; // continue old one
          else {
            const a1 = text.split('\n').slice(lineStart, lineEnd+1)
            rowSources = a1.map(line=> trimLeading(line)) // get new one
          }
          prev.t = text; prev.s = lineStart; prev.ed = lineEnd
          grid = rgxFindTable(prev, rowSources)
          this.grid.push(grid)
        }
        if (grid) ctx.addChild(new SheetRender(tEl, grid))
      })
    }
  }
}