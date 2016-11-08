
var Git = require('nodegit')

module.exports = function (git_repo, code_dir, credentials, sha) {
  var opts = {
    fetchOpts: {
      callbacks: {
        certificateCheck: function () {
          return 1
        }
      }
    }
  }
  // Auth via token
  if (credentials && typeof credentials === 'string') {
    opts.fetchOpts.callbacks.credentials = function () {
      return Git.Cred.userpassPlaintextNew(credentials, 'x-oauth-basic')
    }
  }
  // Auth via SSH Keys
  if (credentials && typeof credentials === 'object') {
    opts.fetchOpts.callbacks.credentials = function (url, user) {
      return Git.Cred.sshKeyMemoryNew(
        user,
        credentials.public_key,
        credentials.private_key,
        ''
      )
    }
  }
  return Git.Clone(git_repo, code_dir, opts).then(function (repo) {
    if (sha) {
      return repo.getCommit(Git.Oid.fromString(sha)).then(function (commit) {
        return Git.Reset.reset(repo, commit, Git.Reset.TYPE.HARD).then(function () {
          return repo
        })
      })
    }
    return repo
  })
}
