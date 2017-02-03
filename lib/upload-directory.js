
const fs = require('fs')
const path = require('path')
const data = require('dataset-cache')
const os = require('os')
const client = require('empirical-client')

function uploadPkgdDirectory (experimentId, dirPath) {
  // Package directory
  return data.hash(dirPath, os.tmpdir())
  // Upload
  .then(function (hash) {
    const pkgPath = path.join(os.tmpdir(), `${hash}.tar`)
    return client.upload(experimentId, {
      filePath: pkgPath,
      isDirectory: true,
      displayPath: path.basename(dirPath)
    }).then(function (asset) {
      // Cleanup
      fs.unlinkSync(pkgPath)
      return asset
    })
  })
}

module.exports = function (experimentId, dir_path, excludes) {
  // List assets
  return new Promise(function (resolve, reject) {
    fs.readdir(dir_path, function (err, files) {
      if (err) return reject(err)
      // Remove excludess by matching the path
      if (excludes && excludes.length) {
        files = files.filter(function (file) {
          return excludes.indexOf(file) === -1
        })
      }
      resolve(files)
    })
  })
  .then(function (files) {
    // Get full-path and package sub-directories
    return Promise.all(files.map(function (f) {
      const fullPath = path.join(dir_path, f)
      if (fs.lstatSync(fullPath).isDirectory()) {
        return uploadPkgdDirectory(experimentId, fullPath)
      } else {
        return client.upload(experimentId, {
          filePath: fullPath,
          displayName: path.basename(fullPath)
        })
      }
    }))
  })
}

