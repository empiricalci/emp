
const logger = require('./logger')
const parseResults = require('./parse-results')
const client = require('empirical-client')

module.exports = function (experimentPath, x_path, results) {
  // TODO: Move parsing to parse report
  try {
    results = parseResults(results, x_path)
  } catch (e) {
    logger.error(e.message)
    return
  }
  //
  var promises = results.map(function (result) {
    return Promise.resolve().then(function () {
      if (result.type === 'image') {
        return client.upload(experimentPath, {
          filePath: result.data
        }).then(function (asset) {
          // Replace data with asset id
          result.data = {assetId: asset.id}
        })
      }
    }).then(function () {
      return client.createResult(experimentPath, result)
    }).then(function () {
      result.status = 'success'
      return result
    }).catch(function (err) {
      result.status = 'failed'
      result.error = err
      return result
    })
  })
  return Promise.all(promises)
}
