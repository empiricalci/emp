var config = require('../config')
var path = require('path')
var shortid = require('shortid')
var mkdir = require('mkdirp')
var YAML = require('yamljs')
var docker = require('./docker')
var git = require('./git')
var client = require('./client')

exports.runTask = function (task) {
  return client.updateBuild({
    _id: task._id,
    status: 'running'
  }).then(function () {
    return createSessionDirs(task._id)
  }).then(function (dirs) {
    if (!task.ssh_url) return Promise.reject('Git repository URL not provided')
    return client.getKeys(dirs.session, task.project_owner, task.project_name).then(function (keys) {
      return git.cloneRepository(
        task.ssh_url,
        keys,
        task.head_sha,
        dirs.code
      )
    }).then(function () {
      console.log('BUILD FULL NAME:', task.full_name)
      var experiment = task
      var exp_config = readExperimentConfig(dirs.code, task.project_name)
      if (!exp_config) return Promise.reject('Experiment name not found on empirical.yml:', experiment.project_name)
      if (exp_config.type !== experiment.project_interface) return Promise.reject('Interface type mismatch')
      experiment.type = experiment.project_interface // TODO: This should probably be renamed
      experiment.environment = exp_config.environment
      experiment.environment.tag = experiment.full_name
      return buildImage(experiment.environment, dirs.code).then(function () {
        return runExperiment(experiment)
      })
    })
  }).then(function () {
    return client.updateBuild({
      _id: task._id,
      status: 'success'
    })
  }, function (err) {
    return client.updateBuild({
      _id: task._id,
      status: 'failed',
      error: err
    })
  })
}

// TODO: Add YML validation.
// Rules:
// - Experiment can only be standalone or solver, evaluator pair
// - First level is experiment_name
// - Second level services_names
function readExperimentConfig (code_dir, experiment_name) {
  var yml = YAML.load(path.resolve(code_dir, config.config_filename))
  return yml.experiments[experiment_name]
}

function createSessionDirs (session_id) {
  // Generate random session id if not provided
  session_id = session_id || shortid.generate()

  // TODO: Get base folder from config
  // Create a tmp folder for the session
  var session_dir = '/tmp/' + session_id
  console.log('Creating directory structure on: ', session_dir)
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
  console.log('BUILDING ENVIRONMENT:', image)
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
    ]
  }
  console.log('RUN STANDALONE:', standalone)
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
  // FIXME: if evaluator Image is not found the solver gets stuck
  var evaluator = {
    image: experiment.evaluator,
    name: `evaluator-${experiment._id}`,
    env: [
      `EXPERIMENT_ID=${experiment._id}`,
      `EMPIRICAL_API_URL=${config.client.root}/api/x`
    ]
  }
  console.log('RUN SOLVER WITH EVALUATOR', solver, evaluator)
  return docker.runLinked(solver, evaluator).then(function (containers) {
    return docker.remove(containers.evaluator).then(function () {
      return docker.stop(containers.solver).then(docker.remove)
    })
  })
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
