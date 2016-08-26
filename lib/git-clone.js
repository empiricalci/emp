
var Git = require('nodegit')

module.exports = function (git_repo, code_dir, token, sha) {
  var opts = {
    fetchOpts: {
      callbacks: {
        certificateCheck: function () {
          return 1
        }
      }
    }
  }
  if (token) {
    opts.fetchOpts.callbacks.credentials = function () {
      return Git.Cred.userpassPlaintextNew(token, 'x-oauth-basic')
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
