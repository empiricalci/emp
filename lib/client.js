
const config = require('../config')
var fetch = require('node-fetch')
var fs = require('fs')

const root = config.client.root
const auth = new Buffer(`${config.client.key}:${config.client.secret}`).toString('base64')
const headers = {
  'Content-Type': 'application/json',
  'Authorization': 'Basic ' + auth
}

exports.getKeys = function (dir, owner, project) {
  return fetch(`${root}/api/projects/${owner}/${project}/keys`, {
    headers: headers
  }).then(function (response) {
    if (!response.ok) return Promise.reject(response.status)
    return response.json().then(function (keys) {
      // Workaround: Save to disk
      // FIXME: Use the from memory. Don't save to disk
      // After: https://github.com/nodegit/nodegit/pull/949
      fs.writeFileSync(`${dir}/public_key`, keys.public_key + '\n', 'utf8') // TODO: WHYYY??
      fs.writeFileSync(`${dir}/private_key`, keys.private_key, 'utf8')
      return {
        public_key: `${dir}/public_key`,
        private_key: `${dir}/private_key`
      }
    })
  })
}

exports.updateBuild = function (payload) {
  console.log('Updating build:', payload)
  return fetch(`${root}/api/builds/${payload._id}`, {
    method: 'PATCH',
    headers: headers,
    body: JSON.stringify(payload)
  }).then(function (response) {
    if (!response.ok) return Promise.reject(response.status)
  })
}

exports.postResults = function (results) {
  // TODO: Post results
}

exports.uploadWorkspace = function (params) {
  // TODO: Upload workspace

}
