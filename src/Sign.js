module.exports = new class {
  Sign = {up: '^', left: '<'}
  isSign = text=> Object.values(this.Sign).includes(text)
  tableId = 'obsidian-sheet'
}