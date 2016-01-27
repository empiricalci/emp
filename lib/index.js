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

exports.buildImages = function (code_dir) {
  var experiments = YAML.load(path.resolve(code_dir, config.config_filename))
  return Promise.all(Object.keys(experiments).map(function (name) {
    // FIXME: Tag image as repo-experiment-short-sha
    var experiment = experiments[name]
    // If an image is defined, no need to build
    if (experiment.image) return Promise.resolve(experiment)
    experiment.t = 'test-' + name
    return docker.build(code_dir, experiment)
  }))
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
