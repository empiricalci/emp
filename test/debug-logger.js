
var debug = require('debug')('emp')

exports.section = function (title) {
  debug(title)
}

exports.write = function (text) {
  debug(text)
}

exports.json = function (json) {
  debug('%o', json)
}

exports.error = function (err) {
  debug(err)
}

exports.log = function (log) {
  debug(log)
}
