
var emp = require('./lib')
var prettyjson = require('prettyjson')
var colors = require('colors/safe')
var data = require('./lib/data')
var listen = require('./listen')
var readline = require('readline')
var fs = require('fs')
var path = require('path')
var client = require('./lib/client')

// TODO: Print help

var args = process.argv

function logSection (section) {
  console.log(colors.white.bold(section))
}

function logHandler (line) {
  process.stdout.write(line)
}

function saveConfiguration () {
  var content = ''
  content = `${content}EMPIRICAL_DIR="${process.env.EMPIRICAL_DIR}"\n`
  content = `${content}EMPIRICAL_API_KEY="${process.env.EMPIRICAL_API_KEY}"\n`
  content = `${content}EMPIRICAL_API_SECRET="${process.env.EMPIRICAL_API_SECRET}"\n`
  fs.writeFileSync('/emp.env', content)
}

function configure () {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })
  rl.question(`Empirical directory [${process.env.EMPIRICAL_DIR}]: `, function (newDir) {
    if (newDir) {
      // TODO: Validate that directory exists?
      if (path.isAbsolute(newDir)) {
        // Save new dir
        process.env.EMPIRICAL_DIR = newDir
        saveConfiguration()
        console.log('Saved new empirical directory:', newDir)
      } else {
        console.log('Error: Please provide an absolute path.')
      }
    } else {
      console.log('Empirical directory not changed')
    }
    rl.close()
  })
}

function login () {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })
  rl.question(`Empirical API Key: [${process.env.EMPIRICAL_API_KEY}]: `, function (newKey) {
    rl.question(`Empirical API Secret: [${process.env.EMPIRICAL_API_SECRET}]: `, function (newSecret) {
      // TODO: Validate the key pair works
      if (newKey) process.env.EMPIRICAL_API_KEY = newKey
      if (newSecret) process.env.EMPIRICAL_API_SECRET = newSecret
      client.setAuth(process.env.EMPIRICAL_API_KEY, process.env.EMPIRICAL_API_SECRET)
      client.getProfile().then(function (profile) {
        saveConfiguration()
        console.log('Logged in successfully. Stored credentials.')
      }).catch(function (err) {
        console.log('Login failed:', err)
      })
      rl.close()
    })
  })
}

function logout () {
  process.env.EMPIRICAL_API_KEY = ''
  process.env.EMPIRICAL_API_SECRET = ''
  saveConfiguration()
  console.log('Logged out successfully. Cleared credentials.')
}

function pull (experiment) {
  logSection('PULL:')
  return client.getBuild(experiment).then(function (build) {
    return client.getKeys(build.repo.full_name).then(function (keys) {
      console.log('Cloning from', build.repo.ssh_url)
      if (build.push.head_sha) console.log(`Checking out ${build.push.head_sha}`)
      return emp.getCodeDir(build.repo.ssh_url, build.push.head_sha, keys)
    }).then(function (dir) {
      return {
        code_dir: dir,
        name: build.name
      }
    })
  })
}

function run (experiment_name, dir) {
  Promise.resolve(dir).then(function (code_dir) {
    // Get code dir
    if (code_dir) {
      return Promise.resolve({
        code_dir: process.env.CODE_DIR,
        name: experiment_name
      })
    } else {
      return pull(experiment_name)
    }
  }).then(function (params) {
    const code_dir = params.code_dir
    // Get experiment configuration
    logSection('EXPERIMENT:')
    var experiment = emp.readExperimentConfig(code_dir, {
      name: params.name
    })
    console.log(prettyjson.render(experiment))
    // Build docker Image
    logSection('BUILD:')
    emp.buildImage(experiment.environment, code_dir, function (data) {
      process.stdout.write(data)
    })
    // Get dataset
    .then(function () {
      logSection('DATASET:')
      return emp.getDataset(code_dir, experiment.dataset).then(function (data) {
        if (!data) console.log('No dataset provided')
        console.log(prettyjson.render(data))
      })
    })
    // Run experiment
    .then(function () {
      logSection('RUN:')
      return emp.runExperiment(experiment, logHandler)
    })
    // Get Results
    .then(function () {
      logSection('RESULTS:')
      return emp.getResults(experiment).then(function (overall) {
        console.log(prettyjson.render({overall: overall}))
        console.log(colors.green.bold('Success'))
      })
    })
  }).catch(function (err) {
    console.log(err)
    console.log(colors.red.bold('Failed'))
  })
}

switch (args[2]) {
  case 'listen':
    listen()
    break
  case 'run':
    run(args[3], args[4])
    break
  case 'configure':
    configure()
    break
  case 'login':
    login()
    break
  case 'logout':
    logout()
    break
  case 'data':
    data(args[3])
    break
  default:
    console.log('Command not found')
}

