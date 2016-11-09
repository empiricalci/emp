
const env = require('node-env-file')
const mkdirp = require('mkdirp')
const fs = require('fs')
const path = require('path')
const assert = require('assert')

const homeDir = /^win/.test(process.platform) ? `${process.env.HOMEDRIVE}${process.env.HOMEPATH}` : process.env.HOME
const envConfigFile = path.join(homeDir, '.emp', 'emp.env')

function createConfigFile () {
  mkdirp.sync(path.join(homeDir, '.emp'))
  fs.writeFileSync(
    envConfigFile,
    `EMPIRICAL_DIR=${path.join(homeDir, 'empirical')}`
  )
}

exports.load = function () {
  // Host
  process.env.EMPIRICAL_HOST = process.env.EMPIRICAL_HOST || 'https://empiricalci.com'
  // Create config file if it doesn't exists
  try {
    var stats = fs.lstatSync(envConfigFile)
    if (!stats.isFile()) createConfigFile()
  } catch (err) {
    if (err && err.code === 'ENOENT') createConfigFile()
  }
  // Load config
  env(envConfigFile)
  // Setup paths
  assert(process.env.EMPIRICAL_DIR, 'There\'s no EMPIRICAL_DIR defined')
  // Define dirs
  process.env.DATA_PATH = path.join(process.env.EMPIRICAL_DIR, 'data')
  process.env.WORKSPACES_PATH = path.join(process.env.EMPIRICAL_DIR, 'workspaces')
  mkdirp.sync(process.env.DATA_PATH)
  mkdirp.sync(process.env.WORKSPACES_PATH)
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
