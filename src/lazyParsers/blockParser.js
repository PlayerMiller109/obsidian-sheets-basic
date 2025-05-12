const { buildContGrid } = require('./buildContGrid.js')
module.exports = (app, ob)=> {
  const SheetRender = require('./SheetRender.js')(app, ob)
  return async (source, el, ctx)=> {
    await ob.MarkdownRenderer.render(app, source, el, '', this)
    const tEl = el.querySelector('table'); if (!tEl) return
    const grid = buildContGrid(source.split('\n'))
    if (grid) ctx.addChild(new SheetRender(tEl, grid))
  }
}