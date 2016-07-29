
const config = require('../config')
var fetch = require('node-fetch')

const root = config.client.root

var auth = new Buffer(`${config.client.key}:${config.client.secret}`).toString('base64')
exports.auth = auth

var headers = {
  'Content-Type': 'application/json',
  'Authorization': 'Basic ' + auth
}

exports.setAuth = function (key, secret) {
  auth = new Buffer(`${key}:${secret}`).toString('base64')
  exports.auth = auth
  headers['Authorization'] = 'Basic ' + auth
}

exports.getProfile = function () {
  return fetch(`${root}/api/v1/profile`, {
    headers: headers
  }).then(function (response) {
    if (!response.ok) return Promise.reject(response.status)
    return response.json()
  })
}

exports.getKeys = function (full_name) {
  return fetch(`${root}/api/v1/projects/${full_name}/keys`, {
    headers: headers
  }).then(function (response) {
    if (!response.ok) return Promise.reject(response.status)
    return response.json()
  })
}

exports.updateExperiment = function (full_name, payload) {
  return fetch(`${root}/api/v1/x/${full_name}`, {
    method: 'PATCH',
    headers: headers,
    body: JSON.stringify(payload)
  }).then(function (response) {
    if (!response.ok) return Promise.reject(new Error(`Failed to update build: ${response.status}`))
    return response.json()
  })
}

exports.getBuild = function (full_name) {
  return fetch(`${root}/api/v1/x/${full_name}`, {
    headers: headers
  }).then(function (response) {
    if (!response.ok) return Promise.reject(response.status)
    return response.json()
  })
}

exports.postResults = function (results) {
  // TODO: Post results
}

exports.uploadWorkspace = function (params) {
  // TODO: Upload workspace

}
