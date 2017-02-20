
const readJSON = require('./read-json')
const path = require('path')

function parseResult (result, workDir) {
  switch (result.type) {
    case 'table':
      if (typeof result.data === 'string') {
        result.data = readJSON(path.resolve(workDir, result.data))
      }
      return result
    default:
      return result
  }
}

module.exports = function (results, workDir) {
  return Object.keys(results).map(function (key) {
    // Attach name
    results[key].name = key
    return parseResult(results[key], workDir)
  })
}
