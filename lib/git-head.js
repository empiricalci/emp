
var Git = require('nodegit')

module.exports = function (code_path) {
  return Git.Repository.open(code_path).then(function (repo) {
    return repo.getHeadCommit().then(function (commit) {
      return commit.sha()
    })
  })
}
