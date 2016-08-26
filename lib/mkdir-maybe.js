
var fs = require('fs')
var mkdirp = require('mkdirp')

module.exports = function (dir) {
  return new Promise(function (resolve, reject) {
    fs.lstat(dir, function (err, stats) {
      if (err && err.code !== 'ENOENT') return reject(err)
      if (err || !stats.isDirectory()) {
        mkdirp.sync(dir)
        fs.chownSync(dir, process.getuid(), process.getgid())
      }
      return resolve(dir)
    })
  })
}

