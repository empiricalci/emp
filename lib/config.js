
const env = require('node-env-file')
const mkdirMaybe = require('./mkdir-maybe')
const fs = require('fs')
const path = require('path')
const assert = require('assert')

const envConfigFile = `${process.env.HOME}/.emp/emp.env`

function loadOrCreateConfig (envFile) {
  return new Promise(function (resolve, reject) {
    fs.lstat(envFile, function (err, stats) {
      if (err && err.code !== 'ENOENT') return reject(err)
      if (err || !stats.isFile()) {
        return mkdirMaybe(path.dirname(envFile))
        .then(function (dir) {
          fs.writeFileSync(
            envFile,
            `EMPIRICAL_DIR=${process.env.HOME}/empirical`
          )
          return resolve()
        })
      } else {
        return resolve()
      }
    })
  }).then(function () {
    env(envFile)
  })
}

exports.load = function () {
  // Host
  process.env.EMPIRICAL_HOST = process.env.EMPIRICAL_HOST || 'https://empiricalci.com'
  // Check if the file exist
  return loadOrCreateConfig(envConfigFile)
  // Setup paths
  .then(function () {
    assert(process.env.EMPIRICAL_DIR, 'There\'s no EMPIRICAL_DIR defined')
    // Define dirs
    process.env.DATA_PATH = `${process.env.EMPIRICAL_DIR}/data`
    process.env.WORKSPACES_PATH = `${process.env.EMPIRICAL_DIR}/workspaces`
  })
}

exports.update = function update (config) {
  if (config.auth) process.env.EMPIRICAL_AUTH = config.auth
  if (config.dir) process.env.EMPIRICAL_DIR = config.dir
  var content = ''
  content = `${content}EMPIRICAL_DIR="${process.env.EMPIRICAL_DIR}"\n`
  content = `${content}EMPIRICAL_AUTH="${process.env.EMPIRICAL_AUTH}"\n`
  fs.writeFileSync(envConfigFile, content)
}

exports.updateDir = function update (newDir) {
  if (newDir) {
    // TODO: Validate that directory exists?
    if (path.isAbsolute(newDir)) {
      exports.update({dir: newDir})
      console.log('Saved new empirical directory:', newDir)
    } else {
      console.log('Error: Please provide an absolute path.')
      return Promise.reject(new Error('Relative paths not allowed'))
    }
  } else {
    console.log('Empirical directory not changed')
  }
  return Promise.resolve()
}
