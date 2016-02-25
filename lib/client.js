
const config = require('../config')
var fetch = require('node-fetch')

const root = config.client.root

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
