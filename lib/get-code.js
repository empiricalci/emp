
const getHeadCommit = require('./git-head')
const pull = require('./pull')

/**
 * Finds or receives a head commit and pulls the code to a temporary directory
 * @param {Object} options
 * @param {String} options.head_sha - SHA of commit to checkout
 * @param {String} options.code_path - Path to the repo to get the head commit SHA
 * @param {String} options.project - project_id: owner/project
 */

module.exports = function (options) {
  if (!options.head_sha) {
    if (!options.code_path) return Promise.reject(new Error('Error: emp run requires a code path'))
    // Get the head_sha from the given code_path
    return getHeadCommit(options.code_path).then(function (head_sha) {
      // Get code
      return pull({
        auth_method: options.auth_method,
        project: options.project,
        head_sha: head_sha
      })
    })
  } else {
    return pull({
      auth_method: options.auth_method,
      project: options.project,
      head_sha: options.head_sha
    })
  }
}
