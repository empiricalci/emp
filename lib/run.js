
const path = require('path')
const colors = require('colors')
const initDirs = require('./init-dirs')
const readProtocol = require('./read-protocol')
const buildImage = require('./build-image')
const cache = require('dataset-cache')
const runExperiment = require('./run-experiment')
const results = require('./results')
const client = require('empirical-client')
const getCode = require('./get-code')

module.exports = function (options, logger) {
  var experiment
  var experimentPath
  return initDirs()
  .then(function () {
    // Get code from GitHub
    if (options.project) {
      return getCode(options).then(function (data) {
        // Attach code_path and head_sha to options
        options.code_path = data.code_path
        options.head_sha = data.head_sha
      })
    }
    // Or, use local code
    if (!options.code_path) return Promise.reject(new Error('Error: emp run requires a code path'))
    options.code_path = path.resolve(process.cwd(), options.code_path)
  })
  .then(function () {
    // Read experiment configuration
    logger.section('EXPERIMENT:')
    experiment = readProtocol(options.code_path, options.protocol)
    if (!experiment) return Promise.reject(new Error(`Protocol "${options.protocol}" not found`))
    logger.json(experiment)
  })
  // Create experiment on the server
  .then(function () {
    if (!options.project) return Promise.resolve()
    return client.createExperiment({
      protocol: options.protocol,
      project_id: options.project,
      head_sha: options.head_sha
    }).then(function (experiment) {
      experimentPath = `${experiment.protocol_id}/${experiment.id}`
    })
  })
  // Build docker Image
  .then(function () {
    logger.section('BUILD:')
    return buildImage(experiment.environment, options.code_path, logger.write)
  })
  // Get dataset
  .then(function () {
    logger.section('DATASET:')
    if (!experiment.dataset) {
      logger.log('No dataset provided')
      return Promise.resolve()
    }
    const data = require(path.join(options.code_path, experiment.dataset))
    return cache.install(data, process.env.DATA_PATH)
    .then(function (data) {
      logger.json(data)
    })
  })
  // Run experiment
  .then(function () {
    logger.section('RUN:')
    return runExperiment(experiment, logger.write)
  })
  // Get Results
  .then(function () {
    logger.section('RESULTS:')
    return results.overall(experiment).then(function (overall) {
      logger.json({overall: overall})
      logger.log(colors.green.bold('Success'))
      return overall
    })
  }).catch(function (err) {
    logger.log(err)
    logger.log(colors.red.bold('Failed'))
    return Promise.reject(new Error(err.message))
  })
  // Save to server
  .then(function (overall) {
    if (!experimentPath) return
    return client.updateExperiment(experimentPath, {
      status: 'success',
      overall: overall
    })
  }, function (err) {
    if (!experimentPath) return Promise.reject(err)
    return client.updateExperiment(experimentPath, {
      status: 'failed',
      error: err.message
    })
  })
}

