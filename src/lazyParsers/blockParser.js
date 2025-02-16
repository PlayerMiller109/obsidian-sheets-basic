module.exports = (app, ob)=> {
  const SheetElement = require('./SheetElement.js')(app, ob)
  return (source, el, ctx)=> source && ctx.addChild(new SheetElement(el, source, !0))
}