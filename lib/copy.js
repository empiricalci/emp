
const data = require('../lib/data')
const fs = require('fs')
const os = require('os')

module.exports = function (source) {
  var isDir = fs.lstatSync(source).isDirectory()
  return Promise.resolve().then(function () {
    if (isDir) {
      return data.hash(source, os.tmpdir())
    } else {
      return data.hash(source)
    }
  })
  .then(function (hash) {
    // Copy file/dir to cache folder
  })
}
