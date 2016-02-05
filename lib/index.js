var config = require('../config')
var path = require('path')
var shortid = require('shortid')
var mkdir = require('mkdirp')
var Git = require('nodegit')
var YAML = require('yamljs')
var docker = require('./docker')

exports.createSessionDirs = function (session_id) {
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

exports.cloneRepository = function (git_repo, sha, code_dir) {
  console.log('Cloning directory from', git_repo)
  return Git.Clone(git_repo, code_dir, {
    fetchOpts: {
      callbacks: {
        certificateCheck: function () {
          return 1
        },
        credentials: function (url, user) {
          return Git.Cred.sshKeyNew(
            user,
            config.git.auth.pubKey,
            config.git.auth.privateKey,
            config.git.auth.passphrase
          )
        }
      }
    }
  }).then(function (repo) {
    if (sha) {
      console.log('Checking out', sha)
      return repo.getCommit(sha)
    }
  })
}

function getBuilds(experiments) {
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

exports.buildImages = function (code_dir) {
  var experiments = YAML.load(path.resolve(code_dir, config.config_filename))
  var builds = getBuilds(experiments)
  console.log(builds)
  console.log(experiments)
  return Promise.all(builds.map(function (build) {
    return docker.build(code_dir, build)
  })).then(function (builds) {
    //TODO: Modify experiments. Attach image to service
    return builds
  })
}

// TODO: Add YML validation.
// Rules:
// - Experiment can only be standalone or solver, evaluator pair
// - First level is experiment_name
// - Second level services_names

function runExperiment(experiment) {
  var services = Object.keys(experiment)
  if (experiment.standalone) {
    return docker.run(experiment)
  } else {
    return docker.run(experiment.evaluator)
  }
}

exports.runExperiments = function (experiments) {
  // TODO: Create workspace dir for the session
  // TODO: Launch the containers with the appropriate data and workspace directories
  // Run experiments
  return Promise.all(experiments.map(function (experiment) {
    return docker.run(experiment)
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
