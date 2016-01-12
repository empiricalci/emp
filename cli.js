var config = require('./config')
var Git = require('nodegit')
var shortid = require('shortid')
var mkdir = require('mkdirp')
var compose = require('./compose')

var handleError = function (err) {
  console.log(err)
  throw err
}

// TODO: Get params from cli
var git_repo = 'git@github.com:alantrrs/emp'

// Generate random session id
// TODO: Get random id from the Request
var session_id = shortid.generate()

// Create a tmp folder for the session
var session_dir = '/tmp/' + session_id
console.log('create dir: ', session_dir)
mkdir.sync(session_dir)

// Clone repository into a temporary code dir
var options = {
  fetchOpts: {
    callbacks: {
      certificateCheck: function () {
        return 1
      },
      credentials: function (url, user) {
        console.log('url:', url)
        console.log('user:', user)
        return Git.Cred.sshKeyNew(
          user,
          config.git.auth.pubKey,
          config.git.auth.privateKey,
          config.git.auth.passphrase
        )
      }
    }
  }
}

var code_dir = session_dir + '/code'
Git.Clone(git_repo, code_dir, options).then(function (repo) {
  // TODO: Verify compatibility
  // TODO: Test if empirical.yml exists and is valid
  return code_dir
}).then(function () {
  // Build image
  var onData = function (data) {
    console.log(data.toString())
  }
  return compose(code_dir, {
    command: 'build',
    file: 'empirical.yml'
  }, onData, onData)
})
.then(function () {
  // TODO: Create workspace dir for the session
  // TODO: Launch the containers with the appropriate data and workspace directories
  // Run experiments
  var onData = function (data) {
    console.log(data.toString())
  }
  return compose(code_dir, {
    command: 'run',
    file: 'empirical.yml',
    options: {
      service: 'empirical' // FIXME: This should come from somewhere else
    }
  }, onData, onData)
})
.catch(handleError)

  // TODO: Post results
  // TODO: Save artifacts/upload
