
const client = require('empirical-client')

module.exports = function (options) {
  var experimentPath
  // Create experiment on the server
  .then(function () {
    return client.createExperiment({
      environment: experiment.environment,
      dataset: experiment.dataset,
      protocol: options.protocol,
      project_id: options.project,
      head_sha: options.head_sha,
      status: options.status,
      overall: options.overall
    }).then(function (exp) {
      // Replace randomly generated id with the one on the server
      experiment.id = exp.id
      experimentPath = `${exp.protocol_id}/${exp.id}`
    })
  })
  // Upload assets
  .then(function (err) {
    if (!experimentPath) return
    return client.uploadLogs(logFile, experimentPath)
    .then(function () {
      if (err instanceof Error) return Promise.reject(err)
      return
    })
  })
}
