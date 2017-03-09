
const data = require('../lib/data')
const fs = require('fs')
const os = require('os')
const tar = require('tar-fs')
const path = require('path')

function copyFile (source, dest) {
  return new Promise(function (resolve, reject) {
    fs.createReadStream(source).pipe(fs.createWriteStream(dest))
    .on('error', reject)
    .on('close', function () {
      resolve(dest)
    })
  })
}

function extractTar (source, dest) {
  return new Promise(function (resolve, reject) {
    fs.createReadStream(source).pipe(tar.extract(dest))
    .on('error', reject)
    .on('close', function () {
      resolve(dest)
    })
  })
}

module.exports = function (source) {
  var isDir = fs.lstatSync(source).isDirectory()
  if (isDir) {
    return data.hash(source, os.tmpdir()).then(function (hash) {
      var sourceTar = path.join(os.tmpdir(), hash)
      const dest = path.join(process.env.DATA_PATH, hash)
      return extractTar(sourceTar, dest)
    })
  } else {
    return data.hash(source).then(function (hash) {
      const dest = path.join(process.env.DATA_PATH, hash)
      return copyFile(source, dest)
    })
  }
}
