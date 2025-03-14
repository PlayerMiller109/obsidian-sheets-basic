module.exports = (app, ob)=> {
  const SheetElement = require('./SheetElement.js')(app, ob)
  return postParser = new class {
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
        }
        else {
          const { text, lineStart, lineEnd } = sec; let rowSources
          if (prev.t == text && prev.s == lineStart && prev.ed == lineEnd) rowSources = prev.r; // continue old one
          else rowSources = text.split('\n').slice(lineStart, lineEnd+1).map(line=> trimLeading(line)) // get new one
          prev.t = text; prev.s = lineStart; prev.ed = lineEnd
          rgxFindTable(prev, rowSources)
          source = rowSources.join('\n')
          this.source.push(source)
        }
        if (!source) return; ctx.addChild(new SheetElement(tEl, source))
      })
    }
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