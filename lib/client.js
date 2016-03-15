
const config = require('../config')
var fetch = require('node-fetch')
var fs = require('fs')

const root = config.client.root

// TODO: Pass credentials to authorize request
exports.getKeys = function (dir, owner, project) {
  return fetch(`${root}/api/projects/${owner}/${project}/keys`, {
    headers: {'Content-Type': 'application/json'}
  }).then(function (response) {
    if (!response.ok) return Promise.reject(response.status)
    return response.json().then(function (keys) {
      // TODO: Save to disk
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
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(payload)
  }).then(function (response) {
    if (!response.ok) return Promise.reject(response.status)
  })
}

exports.createExperiment = function (experiment) {
  return fetch(`${root}/api/x`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(experiment)
  }).then(function (response) {
    return response.json()
  })
}

exports.updateExperiment = function (experiment) {
  return fetch(`${root}/api/x/${experiment._id}`, {
    method: 'PATCH',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(experiment)
  }).then(function (response) {
    return response.json()
  })
}

exports.postResults = function (results) {
  // TODO: Post results
}

exports.uploadWorkspace = function (params) {
  // TODO: Upload workspace

}
