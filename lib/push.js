
const client = require('empirical-client')
const path = require('path')

module.exports = function (x_path, experiment) {
  var experimentPath
  // Create experiment on the server
  return Promise.resolve().then(function () {
    return client.createExperiment(experiment).then(function (exp) {
      // Replace randomly generated id with the one on the server
      experiment.id = exp.id
      experimentPath = `${exp.protocol_id}/${exp.id}`
    })
  })
  // Upload assets
  .then(function (err) {
    if (!experimentPath) return
    return client.uploadLogs(path.join(x_path, experiment.logs), experimentPath)
    .then(function () {
      if (err instanceof Error) return Promise.reject(err)
      return
    })
  })
}
