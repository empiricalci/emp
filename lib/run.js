
const path = require('path')
const colors = require('colors')
const readProtocol = require('./read-protocol')
const buildImage = require('./build-image')
const cache = require('dataset-cache')
const runExperiment = require('./run-experiment')
const readJSON = require('./read-json')
const pull = require('./pull')
const mkdirp = require('mkdirp')
const nvidia = require('./nvidia-docker')
const reporter = require('./report')
const isGitRepo = require('./is-repo')
const debug = require('debug')('emp')
const docker = require('dockerise')

function pathAdapter (fpath) {
  if (!/^win/.test(process.platform)) return fpath
  var root = path.parse(fpath).root
  return path.posix.resolve('/', fpath.replace(root, root.toLowerCase()).replace(':', '').replace(/\\/g, '/'))
}

module.exports = function (options, logger) {
  debug('options: %o', options)
  var experiment
  var logFile
  var timestamp = Date.now()
  var report = {
    timestamp: timestamp,
    durations: {}
  }
  if (!options.protocol) return Promise.reject(new Error('Error: emp run requires a protocol'))
  return Promise.resolve()
  .then(function () {
    // Get code from GitHub
    if (isGitRepo(options.code_path)) {
      var arr = options.code_path.split('#')
      options.repo = arr[0]
      options.commit = arr[1]
      delete options.code_path
      logger.section('PULL:')
      logger.log(`repo: ${options.repo}`)
      if (options.commit) logger.log(`commit: ${options.commit}`)
      return pull(options).then(function (data) {
        // Attach code_path and head_sha to options
        options.code_path = data.code_path
        logger.log(`Cloned to: ${options.code_path}`)
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
    report.protocol = options.protocol
    report.source = {
      type: options.repo ? 'remote' : 'local',
      path: options.code_path,
      repo: options.repo,
      commit: options.commit
    }
    report.environment = experiment.environment
    report.dataset = experiment.dataset
    report.results = experiment.results
  })
  // Create experiment directory and log file
  .then(function () {
    // Create experiment folder with random id
    experiment.directory = path.join(process.env.WORKSPACES_PATH, experiment.id)
    mkdirp.sync(experiment.directory)
    logFile = path.join(experiment.directory, 'experiment.log')
    logger.setLogFile(logFile)
    logger.section('PROTOCOL:')
    logger.json(experiment)
  })
  // Get dataset
  .then(function () {
    report.durations.setup = new Date() - timestamp
    timestamp = new Date()
    logger.log('')
    logger.section('DATASET:')
    debug('dataset: %o', experiment.dataset)
    if (!experiment.dataset) {
      logger.log('No dataset provided')
      return Promise.resolve()
    }
    // If DATA_PATH doesn't exists, create it
    mkdirp.sync(process.env.DATA_PATH)
    return cache.install(experiment.dataset, process.env.DATA_PATH)
    .then(function (data) {
      logger.json(data)
      return data
    })
  })
  // Attach volumes
  .then(function (data) {
    report.durations.dataset = new Date() - timestamp
    timestamp = new Date()
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
  // Build or pull docker Image
  .then(function () {
    if (experiment.environment.build) {
      logger.section('BUILD:')
      return buildImage(experiment.environment, options.code_path, logger.write)
    } else {
      if (!experiment.environment.image) {
        return Promise.reject(new Error('Environment must have a docker image or build one.'))
      }
      logger.section('PULL IMAGE:')
      // Set default workdir
      if (!experiment.environment.workdir) experiment.environment.workdir = '/code'
      // Attach code directory
      experiment.volumes.push(`${pathAdapter(options.code_path)}:${experiment.environment.workdir}`)
      // Pull image
      return docker.pull(experiment.environment.image, undefined, logger.log)
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
    report.durations.environment = new Date() - timestamp
    timestamp = new Date()
    logger.section('RUN:')
    return runExperiment(experiment, logger.write)
  })
  // Get Results
  .then(function () {
    report.durations.run = new Date() - timestamp
    timestamp = new Date()
    logger.section('RESULTS:')
    const overall_path = path.join(process.env.WORKSPACES_PATH, experiment.id, 'overall.json')
    const overall = readJSON(overall_path)
    logger.json({overall: overall})
    logger.log(colors.green.bold('Success'))
    report.overall = overall
    report.status = 'success'
    reporter.write(experiment.directory, report)
    // Turn-off logfile
    logger.setLogFile(null)
    logger.section('REPORT:')
    logger.log(`Workspace saved to ${experiment.directory}`)
    return report
  }).catch(function (err) {
    logger.log(err)
    logger.log(colors.red.bold('Failed'))
    report.status = 'failed'
    if (experiment && experiment.directory) reporter.write(experiment.directory, report)
    if (experiment) logger.log(`Workspace saved to ${experiment.directory}`)
    return Promise.reject(new Error(err.message))
  })
}

