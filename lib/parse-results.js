
const readJSON = require('./read-json')
const path = require('path')

function parseResult (result, workDir) {
  switch (result.type) {
    case 'table':
      if (typeof result.data === 'string') {
        result.data = readJSON(path.resolve(workDir, result.data))
      }
      // Assert it's an array
      if (!(result.data instanceof Array)) throw new Error(`[${result.name}][data] must be an array`)
      // Assert all rows have the same number of cols
      const cols = result.data[0].length
      // Validate columns
      result.data.map(function (row) {
        if (row.length !== cols) {
          throw new Error(`[${result.name}][data]: All rows must have the same number of columns`)
        }
      })
      return result
    default:
      throw new Error(`[${result.name}][type]: Unknow type "${result.type}"`)
  }
}

module.exports = function (results, workDir) {
  return Object.keys(results).map(function (key) {
    // Attach name
    results[key].name = key
    return parseResult(results[key], workDir)
  })
}
