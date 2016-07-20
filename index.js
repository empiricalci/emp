
var emp = require('./lib')
var prettyjson = require('prettyjson')
var colors = require('colors/safe')
var data = require('./lib/data')
var listen = require('./listen')
var readline = require('readline')
var fs = require('fs')
var path = require('path')

// TODO: Print help

var args = process.argv

function logSection (section) {
  console.log(colors.white.bold(section))
}

function logHandler (line) {
  process.stdout.write(line)
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
        fs.writeFileSync('/emp.env', `EMPIRICAL_DIR=${newDir}\n`)
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

function run (experiment_name) {
  const code_dir = '/empirical/code'
  // Read experiment config
  logSection('EXPERIMENT:')
  var experiment = emp.readExperimentConfig(code_dir, {
    name: experiment_name
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
  }).then(function () {
    logSection('RESULTS:')
    return emp.getResults(experiment).then(function (overall) {
      console.log(prettyjson.render({overall: overall}))
      console.log(colors.green.bold('Success'))
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
    run(args[3])
    break
  case 'configure':
    configure()
    break
  case 'data':
    data(args[3])
    break
  default:
    console.log('Command not found')
}

