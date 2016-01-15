var config = require('../config')
var shortid = require('shortid')
var mkdir = require('mkdirp')
var Git = require('nodegit')
var YAML = require('yamljs')
var compose = require('./compose')

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

exports.cloneRepository = function (git_repo, code_dir) {
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
  })
}

exports.buildImage = function (code_dir, yml_file) {
  // TODO: Test if empirical.yml exists and is valid
  // Build image
  return compose(code_dir, {
    command: 'build',
    file: yml_file
  }, exports.onStdOut, exports.onStdErr)
}

exports.runExperiments = function (code_dir, yml_file) {
  // TODO: Do we need code_dir? Maybe for dev, but not for prod?
  // TODO: Create workspace dir for the session
  // TODO: Launch the containers with the appropriate data and workspace directories
  // Run experiments
  return compose(code_dir, {
    command: 'run',
    file: yml_file,
    service: Object.keys(YAML.load(yml_file))[0]
  }, exports.onStdOut, exports.onStdErr)
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
  throw err
}
