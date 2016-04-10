
var Git = require('nodegit')

exports.cloneRepository = function (git_repo, keys, sha, code_dir) {
  return Git.Clone(git_repo, code_dir, {
    fetchOpts: {
      callbacks: {
        certificateCheck: function () {
          return 1
        },
        credentials: function (url, user) {
          return Git.Cred.sshKeyNew(
            user,
            keys.public_key,
            keys.private_key,
            ''
          )
        }
      }
    }
  }).then(function (repo) {
    if (sha) {
      return repo.getCommit(Git.Oid.fromString(sha)).then(function (commit) {
        return Git.Reset.reset(repo, commit, Git.Reset.TYPE.HARD)
      })
    }
    return repo
  })
}
