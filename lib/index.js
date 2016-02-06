var config = require('../config')
var path = require('path')
var shortid = require('shortid')
var mkdir = require('mkdirp')
var YAML = require('yamljs')
var docker = require('./docker')
var git = require('./git')

exports.runTask = function (task) {
  if (!task.ssh_url) return Promise.reject('Git repository URL not provided')
  return createSessionDirs(task._id).then(function (dirs) {
    return git.cloneRepository(task.ssh_url, task.head_sha, dirs.code).then(function () {
      return buildImages(dirs.code)
    }).then(function (experiments) {
      return runExperiments(experiments)
    })
  })
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

function getBuilds (experiments) {
  var uniques = {}
  var builds = []
  Object.keys(experiments).forEach(function (exp) {
    var experiment = experiments[exp]
    Object.keys(experiment).forEach(function (service) {
      var build = experiment[service]
      // Index is set by build path and dockerfile
      var index = `${build.build}${build.dockerfile}`
      // If an image is defined, no need to build
      if (!build.image) {
        build.experiment = exp
        build.service = service
        build.tag = `${exp}-${service}`
        // Check unique build
        if (!uniques[index]) {
          uniques[index] = build.tag
          builds.push(build)
          experiments[exp][service].image = build.tag
        } else {
          experiments[exp][service].image = uniques[index].tag
        }
      }
    })
  })
  return builds
}

function buildImages (code_dir) {
  var experiments = YAML.load(path.resolve(code_dir, config.config_filename))
  var builds = getBuilds(experiments)
  console.log(builds)
  console.log(experiments)
  return Promise.all(builds.map(function (build) {
    return docker.build(code_dir, build)
  })).then(function (builds) {
    // Return modified experiments with image attached to service
    return experiments
  })
}

// TODO: Add YML validation.
// Rules:
// - Experiment can only be standalone or solver, evaluator pair
// - First level is experiment_name
// - Second level services_names

function runExperiment (experiment) {
  if (experiment.standalone) {
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
      console.log('CONTAINERS:', containers)
      return docker.remove(containers.client).then(function () {
        return docker.stop(containers.server).then(docker.remove)
      })
    })
  }
}

function runExperiments (experiments) {
  // TODO: Create workspace dir for the session
  // TODO: Launch the containers with the appropriate data and workspace directories
  // Run experiments
  var exps = Object.keys(experiments)
  return Promise.all(exps.map(function (x) {
    return runExperiment(experiments[x])
  }))
}

exports.postResults = function () {
  // TODO: Post results
}

exports.uploadWorkspace = function () {
  // TODO: Upload workspace
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
