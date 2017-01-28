
const gitClone = require('./git-clone')
const client = require('empirical-client')
const shortid = require('shortid')
const debug = require('debug')('emp')

/*
 * Pulls the code repository from GitHub
 * @param {String} options.repo - Git repository URL
 * @param {String} [options.private] - True if the repository is private.
 * @param {String} [options.auth_method] - ssh or token
 * @param {String} [options.code_path] - Directory to be created with the contents of the repo
 * @param {String} [options.commit] - SHA of the commit to checkout after downloading
 * @returns {Object} code_path and head_sha of the code repository
 */

module.exports = function (options) {
  // Use temp path if none is given
  var code_path = options.code_path || `/tmp/${options.repo.split('/').pop()}-${shortid.generate()}`
  debug('pulling to : %s', code_path)
  return Promise.resolve().then(function () {
    // Only get Auth Token if the repository is private
    if (options.private) {
      if (options.auth_method && options.auth_method === 'ssh') {
        return client.getKeys(options.project)
      }
      return client.getAuthToken().then(function (data) {
        return data.token
      })
    }
  }).then(function (credentials) {
    return gitClone(
      options.repo,
      code_path,
      credentials,
      options.commit
    )
  }).then(function () {
    return {
      code_path: code_path,
      head_sha: options.head_sha
    }
  })
}
