
const client = require('empirical-client')
const path = require('path')
const uploadDir = require('./upload-directory')
const report = require('./report')

module.exports = function (projectId, x_path, msg) {
  // Read report
  var reportData = report.read(x_path)
  const logsPath = path.join(x_path, reportData.logs)
  // Attach message
  reportData.message = msg
  // Create experiment on the server
  return client.createExperiment(projectId, reportData).then(function (experiment) {
    const experimentPath = `${experiment.project_id}/x/${experiment.id}`
    // Upload logs
    return client.uploadLogs(experimentPath, logsPath)
    .then(function () {
      // Upload directory
      const excludes = [logsPath]
      return uploadDir(experimentPath, x_path, excludes)
    })
  })
}
