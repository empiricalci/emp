
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
var mkdirp = require('mkdirp')
const nvidia = require('./nvidia-docker')

function pathAdapter (fpath) {
  if (!/^win/.test(process.platform)) return fpath
  var root = path.parse(fpath).root
  return path.posix.resolve('/', fpath.replace(root, root.toLowerCase()).replace(':', '').replace(/\\/g, '/'))
}

module.exports = function (options, logger) {
  var experiment
  var experimentPath
  var logFile
  if (!options.protocol) return Promise.reject(new Error('Error: emp run requires a protocol'))
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
    experiment = readProtocol(options.code_path, options.protocol)
    if (!experiment) return Promise.reject(new Error(`Protocol "${options.protocol}" not found`))
  })
  // Create experiment on the server
  .then(function () {
    if (!options.project) return Promise.resolve()
    return client.createExperiment({
      environment: experiment.environment,
      dataset: experiment.dataset,
      protocol: options.protocol,
      project_id: options.project,
      head_sha: options.head_sha
    }).then(function (exp) {
      // Replace randomly generated id with the one on the server
      experiment.id = exp.id
      experimentPath = `${exp.protocol_id}/${exp.id}`
    })
  })
  // Create experiment directory and log file
  .then(function () {
    // Create experiment folder with random id
    experiment.directory = path.join(process.env.WORKSPACES_PATH, experiment.id)
    mkdirp.sync(experiment.directory)
    logFile = path.join(experiment.directory, 'experiment.log')
    logger.setLogFile(logFile)
    logger.section('EXPERIMENT:')
    logger.json(experiment)
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
    return cache.install(experiment.dataset, process.env.DATA_PATH)
    .then(function (data) {
      logger.json(data)
      return data
    })
  })
  // Attach volumes
  .then(function (data) {
    // Attach workspace
    experiment.volumes = [`${pathAdapter(experiment.directory)}:/workspace`]
    // Attach datasets
    if (data) {
      for (var key in data) {
        const resource = data[key]
        experiment.volumes.push(`${pathAdapter(resource.path)}:/data/${key}:ro`)
      }
    }
  })
  // Attach nvidia volumes and devices
  .then(function () {
    if (!experiment.environment.gpu_enabled) return
    logger.section('GPU_ENABLED:')
    return nvidia.getParams().then(function (params) {
      logger.json(params)
      experiment.volumes = experiment.volumes.concat(params.Volumes)
      experiment.devices = params.Devices
      experiment.volumeDriver = params.VolumeDriver
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
    }).then(function () {
      return err
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

