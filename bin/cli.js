#!/usr/bin/env node

const data = require('../lib/data')
const usage = require('../lib/usage')
const config = require('../config')
const auth = require('../lib/auth')
const run = require('../lib/run')
const replicate = require('../lib/replicate')
const logger = require('../lib/logger')
const read = require('read')
const client = require('empirical-client')
const push = require('../lib/push')
const isExperimentId = require('../lib/is-experiment-id')

function version () {
  const emp_version = require('../package.json').version
  console.log(`emp version: ${emp_version}`)
}

function captureCredentials () {
  var creds = process.env.EMPIRICAL_AUTH ? new Buffer(process.env.EMPIRICAL_AUTH, 'base64').toString() : ''
  creds = creds.split(':')
  var user = creds.length === 2 ? creds[0] : 'None'
  console.log('Log in with your Empirical credentials. If you don\'t have an account, create one at https://empiricalci.com')
  return new Promise(function (resolve, reject) {
    read({prompt: `Username [${user}]: `}, function (err, newUser) {
      if (err) return reject(err)
      read({prompt: 'Password: ', silent: true}, function (err, newPass) {
        if (err) return reject(err)
        return resolve({user: newUser, password: newPass})
      })
    })
  })
}

function captureDirectory () {
  return new Promise(function (resolve, reject) {
    read({prompt: `Empirical directory [${process.env.EMPIRICAL_DIR}]: `}, function (err, newDir) {
      if (err) return reject(err)
      return resolve(newDir)
    })
  })
}

function dataCLI (subcommand, source, dir) {
  switch (subcommand) {
    case 'get':
      return data.get(source, dir).then(function (info) {
        logger.json(info)
      }).catch(function (err) {
        logger.error(err.message)
      })
    case 'hash':
      return data.hash(source).then(function (hash) {
        logger.log(`${source}\t${hash}`)
      }).catch(function (err) {
        logger.error(err.message)
      })
    default:
      usage.data()
      return Promise.resolve()
  }
}

function execute (args) {
  switch (args._[2]) {
    case 'run':
      if (!args._[3] || args.help || args.h) {
        usage.run()
        return Promise.resolve()
      }
      if (isExperimentId(args._[3])) {
        return replicate(args._[3], logger)
      }
      return run({
        protocol: args._[3],
        code_path: args._[4]
      }, logger)
    case 'push':
      if (!args._[3] || args.help || args.h) {
        usage.push()
        return Promise.resolve()
      }
      return push(
        args._[4],
        args._[3],
        args.m || args.message,
        args.f || args.force
      )
    case 'configure':
      return captureDirectory().then(config.updateDir)
    case 'login':
      return captureCredentials().then(auth.login)
      .then(function () {
        logger.log('Logged in successfully. Credentials stored.')
      }).catch(function (err) {
        logger.error(err.message)
        return Promise.reject()
      })
    case 'logout':
      return auth.logout().then(function () {
        logger.log('Logged out successfully. Credentials cleared.')
      })
    case 'data':
      return dataCLI(args._[3], args._[4], args.dir)
    case 'version':
      version()
      return Promise.resolve()
    default:
      usage.main()
      return Promise.resolve()
  }
}

config.load()
var argv = require('minimist')(process.argv, {boolean: ['dir', 'force', 'f']})
client.init({
  host: process.env.EMPIRICAL_HOST,
  auth: process.env.EMPIRICAL_AUTH
})
execute(argv).then(function () {
  // Exit normally
  process.exit(0)
}).catch(function (err) {
  logger.error(err)
  // Exit with an error
  process.exit(1)
})
