
const cache = require('dataset-cache')

exports.get = function (url, dir) {
  return cache.get({url: url, directory: dir}, process.env.DATA_PATH).then(function (data) {
    // Show source url
    data.url = url
    // Don't display unecessary variables
    delete data.valid
    delete data.cached
    return data
  })
}

exports.hash = function (path) {
  return cache.hash(path)
}

