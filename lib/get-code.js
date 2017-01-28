
const getHeadCommit = require('./git-head')
const pull = require('./pull')

/**
 * Finds or receives a head commit and pulls the code to a temporary directory
 * @param {Object} options
 * @param {String} options.commit - SHA of commit to checkout
 * @param {String} options.code_path - Path to the repo to get the head commit SHA
 * @param {String} options.repo - repo url
 */

module.exports = function (options) {
  if (!options.commit) {
    if (!options.code_path) return Promise.reject(new Error('Error: emp run requires a code path'))
    // Get the commit from the given code_path
    return getHeadCommit(options.code_path).then(function (commit) {
      // Get code
      return pull({
        auth_method: options.auth_method,
        repo: options.repo,
        commit: commit
      })
    })
  } else {
    return pull({
      auth_method: options.auth_method,
      repo: options.repo,
      commit: options.commit
    })
  }
}
