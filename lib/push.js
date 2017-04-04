
const client = require('empirical-client')
const path = require('path')
const uploadDir = require('./upload-directory')
const report = require('./report')
const logger = require('./logger')
const postResults = require('./post-results')

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
    if (force) {
      return client.createProject(projectId).then(function () {
        logger.log(`Created project: ${projectId}`)
      }).catch(function (err) {
        // Swallow 409 error - means project is already created
        if (err.status !== 409) return Promise.reject(err)
        logger.log(`Project ${projectId} already exists`)
      })
    }
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
      if (!reportData.results) return
      logger.log('Results:')
      return postResults(experimentPath, x_path, reportData.results).then(function (results) {
        results.forEach(function (result) {
          if (result.status === 'success') {
            logger.log(`Posted ${result.name}`)
          } else {
            logger.error(`Failed to post ${result.name}`)
          }
        })
      })
    }).then(function () {
      logger.log(`See your experiment at ${process.env.EMPIRICAL_HOST}/${experimentPath}`)
    })
  }).catch(function (err) {
    logger.error(err.message)
    return Promise.reject(err)
  })
}
