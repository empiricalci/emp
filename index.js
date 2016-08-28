
var data = require('./lib/data')
var usage = require('./lib/usage')
var config = require('./lib/config')
var auth = require('./lib/auth')
var run = require('./lib/run')
const replicate = require('./lib/replicate')
var logger = require('./lib/logger')
var read = require('read')
const client = require('empirical-client')

function version () {
  const emp_version = require('./package.json').version
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

function dataCLI (subcommand, source) {
  switch (subcommand) {
    case 'get':
      return data.get(source).then(function (info) {
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
    case 'replicate':
      return replicate(args._[3], args._[4], logger)
      .catch(function (err) {
        logger.log(err.message)
        return Promise.reject()
      })
    case 'run':
      return run({
        protocol: args._[3],
        code_path: args._[4],
        project: args.s || args.save,
        head_sha: args.v || args.version
      }, logger)
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
        console.log('Logged out successfully. Credentials cleared.')
      })
    case 'data':
      return dataCLI(args._[3], args._[4])
    case 'version':
      return version()
    default:
      return usage.main()
  }
}

config.load().then(function () {
  var argv = require('minimist')(process.argv)
  client.init({
    host: process.env.EMPIRICAL_HOST,
    auth: process.env.EMPIRICAL_AUTH
  })
  return execute(argv)
}).then(function () {
  // Exit normally
  process.exit(0)
}).catch(function () {
  // Exit with an error
  process.exit(1)
})
