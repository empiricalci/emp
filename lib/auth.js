
var config = require('./config')
var client = require('empirical-client')

exports.login = function (creds) {
  var auth
  if (creds.user || creds.password) {
    auth = new Buffer(`${creds.user}:${creds.password}`).toString('base64')
  }
  client.init({host: process.env.EMPIRICAL_HOST, auth: auth})
  return client.getProfile().then(function (profile) {
    config.update({auth: auth})
  }).catch(function (err) {
    if (err.status === 401) {
      return Promise.reject(new Error('Login failed. Wrong credentials.'))
    }
    return Promise.reject(new Error('Something went wrong.'))
  })
}

exports.logout = function () {
  config.update({auth: 'None'})
  return Promise.resolve()
}
