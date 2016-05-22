
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

exports.getKeys = function (full_name) {
  return fetch(`${root}/api/projects/${full_name}/keys`, {
    headers: headers
  }).then(function (response) {
    if (!response.ok) return Promise.reject(response.status)
    return response.json()
  })
}

exports.updateBuild = function (payload) {
  return fetch(`${root}/api/builds/${payload._id}`, {
    method: 'PATCH',
    headers: headers,
    body: JSON.stringify(payload)
  }).then(function (response) {
    if (!response.ok) return Promise.reject('Failed to update build:', response.status)
    return response.json()
  })
}

exports.getBuild = function (full_name) {
  return fetch(`${root}/api/b/${full_name}`, {
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
