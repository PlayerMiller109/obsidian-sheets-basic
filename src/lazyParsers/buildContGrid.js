const fI = (arr, isPipeStart)=> arr.findIndex(
  i=> (isPipeStart ? /^\|/ : /^(?!\|)/).test(i)
)
module.exports = new class {
  borderRE = /(?<!\\)\|/
  headerRE = /^\s*?(\:)?(?:-+)(\:)?\s*/
  // trim content before |
  trimLeading = line=> line.replace(/^.*?(?=(?<!\\)\|)/, '')
  rgxFindTable = (prev, rowSources)=> {
    if (rowSources[0].startsWith('```')) return // exclude codeblock
    rowSources.splice(0, fI(rowSources, !0))
    let endIndex = fI(rowSources), contGrid
    while (endIndex > -1) {
      const expected = rowSources.splice(0, endIndex)
      contGrid = this.buildContGrid(expected)
      if (!contGrid) {
        rowSources.splice(0, fI(rowSources, !0))
        endIndex = fI(rowSources)
        continue
      }
      prev.r = rowSources
      return contGrid
    }
    if (endIndex === -1) {
      return this.buildContGrid(rowSources)
    }
  }
  buildContGrid = (sources)=> {
    const contGrid = sources.filter(row=> row).map(
      row=> row.split(this.borderRE).slice(1, -1).map(cell=> cell.trim())
    )
    const headerRow = contGrid.findIndex(
      row=> row.every(col=> this.headerRE.test(col))
    )
    if (contGrid[headerRow-1] && contGrid[headerRow+1]) {
      contGrid.splice(headerRow, 1)
      return contGrid
    }
  }
}