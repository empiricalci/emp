
const config = require('../config')
var fetch = require('node-fetch')

const root = config.client.root

exports.updateBuild = function (payload) {
  console.log('Updating build status:', payload)
  return fetch(root + '/api/builds/' + payload._id, {
    method: 'PATCH',
    body: payload
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
