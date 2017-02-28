
const docker = require('dockerise')
const path = require('path')
const readProtocol = require('./read-protocol')
const buildImage = require('./build-image')
const cache = require('dataset-cache')
const mkdirp = require('mkdirp')
const pathAdapter = require('./path-adapter')

function runInteractive (options, logger) {
  if (!options.protocol) return Promise.reject(new Error('Error: emp run -i requires a protocol'))
  var experiment
  console.log('RUNNING INTERACTIVE')
  return Promise.resolve()
  .then(function () {
    // Or, use local code
    if (!options.code_path) return Promise.reject(new Error('Error: emp run -i requires a code path'))
    options.code_path = path.resolve(process.cwd(), options.code_path)
  })
  .then(function () {
    // Read experiment configuration
    experiment = readProtocol(options.code_path, options.protocol)
    if (!experiment) return Promise.reject(new Error(`Protocol "${options.protocol}" not found`))
  })
  .then(function () {
    // Create experiment folder with random id
    experiment.directory = path.join(process.env.WORKSPACES_PATH, experiment.id)
    mkdirp.sync(experiment.directory)
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
    experiment.volumes = experiment.environment.volumes || []
    // Attach workspace
    experiment.volumes.push(`${pathAdapter(experiment.directory)}:/workspace`)
    // Attach datasets
    if (data) {
      for (var key in data) {
        const resource = data[key]
        experiment.volumes.push(`${pathAdapter(resource.path)}:/data/${key}:ro`)
      }
    }
  })
  // Run experiment
  .then(function () {
    logger.section('RUN INTERACTIVELY:')
    return new Promise(function (resolve, reject) {
      docker.runInteractive({
        image: experiment.environment.tag,
        binds: experiment.volumes,
        entrypoint: experiment.environment.entrypoint
      })
    })
  })
  // Log errors
  .catch(function (err) {
    console.log(err)
    return Promise.reject(err)
  })
}

module.exports = runInteractive
