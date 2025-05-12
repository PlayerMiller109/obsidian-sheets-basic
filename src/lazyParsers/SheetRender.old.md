
```js
this.tableHead = tableEl.createEl('thead')
this.tableBody = tableEl.createEl('tbody')
```

```js
if (this.headerRow !== -1) {
  const heads = this.contGrid[this.headerRow]
  this.colStyles = this.getHeaderStyles(heads)
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
```
