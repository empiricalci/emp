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
    return git.cloneRepository(
      task.ssh_url,
      task.head_sha,
      dirs.code
    ).then(function () {
      var project = readProject(dirs.code, task.project_name)
      project.image.tag = `${task.project_owner}/${task.project_name}:${task.label}`
      return buildImage(project.image, dirs.code).then(function () {
        if (project.experiements) {
          return runExperiments(project.image, project.experiments)
        }
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
function readProject (code_dir, project_name) {
  var yml = YAML.load(path.resolve(code_dir, config.config_filename))
  return yml.projects[project_name]
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
  // Execute builds sequentially
  console.log('BUILDING IMAGE:', image)
  return docker.build(code_dir, image)
}

function runExperiment (image, experiment) {
  if (experiment.command) {
    var standalone = experiment.standalone
    standalone.name = 'standalone'
    return docker.run(standalone).then(function (res) {
      return docker.remove(res.container)
    })
  } else {
    var server = experiment.solver
    server.name = 'solver'
    var client = experiment.evaluator
    client.name = 'client'
    return docker.runLinked(server, client).then(function (containers) {
      return docker.remove(containers.client).then(function () {
        return docker.stop(containers.server).then(docker.remove)
      })
    })
  }
}

function runExperiments (image, experiments) {
  // TODO: Create workspace dir for the session
  // TODO: Launch the containers with the appropriate data and workspace directories
  // Run experiments sequentially
  return experiments.reduce(function (sequence, x) {
    return sequence.then(function () {
      console.log('RUNNING EXPERIMENT:', x)
      return runExperiment(image, x)
    })
  }, Promise.resolve())
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
