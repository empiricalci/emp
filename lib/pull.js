
const gitClone = require('./git-clone')
const client = require('empirical-client')
const shortid = require('shortid')
const debug = require('debug')('emp')

/*
 * Pulls the code repository from GitHub
 * @param {String} options.project - Repository full_name on GitHub (owner/name)
 * @param {String} [options.private] - True if the repository is private.
 * @param {String} [options.auth_method] - ssh or token
 * @param {String} [options.code_path] - Directory to be created with the contents of the repo
 * @param {String} [options.head_sha] - SHA of the commit to checkout after downloading
 * @returns {Object} code_path and head_sha of the code repository
 */

module.exports = function (options) {
  // Use temp path if none is given
  var code_path = options.code_path || `/tmp/${options.project.split('/').pop()}-${shortid.generate()}`
  debug('pulling to : %s', code_path)
  return Promise.resolve().then(function () {
    // Only get Auth Token if the repository is private
    if (options.private) {
      if (options.auth_method && options.auth_method === 'ssh') {
        return client.getKeys(options.project)
      }
      return client.getAuthToken()
    }
  }).then(function (credentials) {
    const https_url = `https://github.com/${options.project}.git`
    return gitClone(
      https_url,
      code_path,
      credentials,
      options.head_sha
    )
  }).then(function () {
    return {
      code_path: code_path,
      head_sha: options.head_sha
    }
  })
}
