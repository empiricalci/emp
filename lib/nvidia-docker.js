
var fetch = require('node-fetch')

const nvidiaHost = 'http://localhost:3476'

exports.getParams = function () {
  return fetch(`${nvidiaHost}/v1.0/docker/cli/json`)
  .then(function (res) {
    if (!res.ok) return Promise.reject(new Error('Failed to connect to nvidia-docker'))
    return res.json()
  })
}

