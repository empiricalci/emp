
var config = require('../config')
var Git = require('nodegit')

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
