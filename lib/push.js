
const client = require('empirical-client')
const path = require('path')
const uploadDir = require('./upload-directory')
const report = require('./report')
const logger = require('./logger')
const parseResults = require('./parse-results')

module.exports = function (projectId, x_path, msg, force) {
  logger.section('PUSH:')
  // Read report
  try {
    var reportData = report.read(x_path)
  } catch (err) {
    logger.error(err.message)
    return Promise.reject(err)
  }
  // Attach message
  reportData.message = msg
  return Promise.resolve().then(function () {
    // Create project if it doesn't exists
    if (force) return client.createProject(projectId)
  }).then(function () {
    // Create experiment on the server
    return client.createExperiment(projectId, reportData)
  })
  .then(function (experiment) {
    const experimentPath = `${experiment.project_id}/x/${experiment.id}`
    logger.log('Created experiment.')
    // Upload logs
    return client.uploadLogs(experimentPath, path.join(x_path, reportData.logs))
    .then(function () {
      // Upload directory
      const excludes = [reportData.logs, report.fileName]
      return uploadDir(experimentPath, x_path, excludes)
    }).then(function (assets) {
      if (assets && assets.length) logger.log(`Uploaded ${assets.length} artifacts.`)
      // Post results
      if (reportData.results) {
        logger.log('Results:')
        try {
          var results = parseResults(reportData.results, x_path)
        } catch (e) {
          logger.error(e.message)
          return
        }
        var promises = results.map(function (result) {
          return client.createResult(experimentPath, result).then(function () {
            logger.log(`Posted ${result.name}`)
          }).catch(function () {
            logger.error(`Failed to post ${result.name}`)
          })
        })
        return Promise.all(promises)
      }
    }).then(function () {
      logger.log(`See your experiment at ${process.env.EMPIRICAL_HOST}/${experimentPath}`)
    })
  }).catch(function (err) {
    logger.error(err.message)
    return Promise.reject(err)
  })
}
