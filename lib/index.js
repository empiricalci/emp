var config = require('../config')
var path = require('path')
var shortid = require('shortid')
var mkdir = require('mkdirp')
var YAML = require('yamljs')
var docker = require('./docker')
var git = require('./git')
var client = require('./client')
var cache = require('dataset-cache')

exports.runTask = function (task) {
  log('Build', task._id, 'is now running')
  return client.updateBuild({
    _id: task._id,
    status: 'running'
  }).then(function () {
    return createSessionDirs(task._id)
  }).then(function (dirs) {
    if (!task.ssh_url) return Promise.reject('Git repository URL not provided')
    return client.getKeys(dirs.session, task.project_owner, task.project_name).then(function (keys) {
      log('Cloning from', task.ssh_url)
      if (task.head_sha) log('commit', task.head_sha)
      return git.cloneRepository(
        task.ssh_url,
        keys,
        task.head_sha,
        dirs.code
      )
    }).then(function () {
      log('BUILD FULL NAME:', task.full_name)
      var experiment = readExperimentConfig(dirs.code, task)
      return buildImage(experiment.environment, dirs.code).then(function () {
        // Push built Image
        if (experiment.type !== 'evaluator') return
        return docker.push(experiment.environment.tag, onPushProgress).then(function () {
          // Save to database
          return client.updateBuild({
            _id: experiment._id,
            image: experiment.environment.tag
          })
        })
      }).then(function () {
        // Get dataset
        return getDataset(experiment.dataset)
      }).then(function (data) {
        if (!data) console.log('No dataset provided')
        return runExperiment(experiment)
      })
    })
  }).then(function () {
    log('Build', task._id, 'succeeded')
    return client.updateBuild({
      _id: task._id,
      status: 'success'
    })
  }, function (err) {
    log('Build', task._id, 'failed with err:', err)
    return client.updateBuild({
      _id: task._id,
      status: 'failed',
      error: err
    })
  })
}

function getDataset (dataset) {
  if (dataset) {
    return cache.install(dataset, config.data_dir)
  } else {
    return null
  }
}

function readExperimentConfig (code_dir, task) {
  var yml = YAML.load(path.resolve(code_dir, config.config_filename))
  var exp_config = yml.experiments[task.project_name]
  if (!exp_config) throw new Error('Experiment name not found on empirical.yml:', task.project_name)
  if (!task._id) { // if being used as CLI
    exp_config._id = shortid.generate()
    exp_config.environment.tag = `${task.project_name}`
    return exp_config
  }
  if (exp_config.type !== task.project_interface) throw new Error('Interface type mismatch')
  var experiment = task
  experiment.type = experiment.project_interface // TODO: This should probably be renamed
  experiment.environment = exp_config.environment
  experiment.environment.tag = `${config.registry.username}/${experiment._id}`
  experiment.dataset = exp_config.dataset
  return experiment
}

function createSessionDirs (session_id) {
  // Generate random session id if not provided
  session_id = session_id || shortid.generate()

  // TODO: Get base folder from config
  // Create a tmp folder for the session
  var session_dir = '/tmp/' + session_id
  log('Creating directory structure on: ', session_dir)
  mkdir.sync(session_dir)
  mkdir.sync(session_dir + '/workspace')
  return Promise.resolve({
    code: session_dir + '/code',
    workspace: session_dir + '/workspace',
    session: session_dir,
    _id: session_id
  })
}

function buildImage (image, code_dir) {
  log('BUILDING ENVIRONMENT:', image)
  return docker.build(code_dir, image)
}

function runExperiment (experiment) {
  switch (experiment.type) {
    case 'evaluator':
      // Evaluator doesn't run experiments
      return Promise.resolve()
    case 'solver':
      return runSolver(experiment)
    case 'standalone':
      return runStandalone(experiment)
    default:
      return Promise.reject('Unknown experiment type:', experiment.type)
  }
}

function runStandalone (experiment) {
  var standalone = {
    image: experiment.environment.tag,
    name: `standalone-${experiment._id}`,
    env: [
      `EXPERIMENT_ID=${experiment._id}`,
      `EMPIRICAL_API_URL=${config.client.root}/api/x`
    ],
    binds: [
      `${config.HOST_DIR}/data:/data:ro`
    ]
  }
  log('RUN STANDALONE:', standalone)
  return docker.run(standalone).then(function (res) {
    return docker.remove(res.container)
  })
}

function runSolver (experiment) {
  if (!experiment.evaluator) return Promise.reject('No evaluator defined')
  var solver = {
    image: experiment.environment.tag,
    name: `solver-${experiment._id}`
  }
  return client.getBuild(experiment.evaluator).then(function (res) {
    if (!res.image) return Promise.reject('Evaluator does\'t specify an image')
    var evaluator = {
      image: res.image,
      name: `evaluator-${experiment._id}`,
      env: [
        `EXPERIMENT_ID=${experiment._id}`,
        `EMPIRICAL_AUTH=${client.auth}`,
        `EMPIRICAL_API_URL=${config.client.root}/api/x`
      ]
    }
    log('RUN SOLVER WITH EVALUATOR', solver.image, evaluator.image)
    // Pull and Run
    return docker.pull(evaluator.image, log).then(function () {
      return docker.runLinked(solver, evaluator)
    }).then(function (containers) {
      console.log('Containers:', containers)
      // Cleanup
      return docker.remove(containers.evaluator).then(function () {
        return docker.stop(containers.solver).then(docker.remove)
      })
    })
  })
}

function onPushProgress (data) {
  console.log(data)
}

function log (data) {
  if (typeof data !== String) data = [].slice.call(arguments).join(' ')
  if (process.env.EMPIRICAL_ENV !== 'test' || process.env.DEBUG) console.log(data)
}

exports.onStdOut = function (log) {
  process.stdout.write(log.toString())
// TODO: if on Client mode send message
}

exports.onStdErr = function (err) {
  process.stderr.write(err.toString())
// TODO: if on Client mode send message
}

exports.handleError = function (err) {
  // TODO: if on Client mode send message
  console.error(err)
}

// Export relevant functions
exports.client = client
exports.git = git
exports.readExperimentConfig = readExperimentConfig
exports.createSessionDirs
exports.buildImage = buildImage
exports.getDataset = getDataset
exports.runExperiment = runExperiment
exports.log = log
