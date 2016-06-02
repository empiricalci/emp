
var emp = require('./lib')
var worker = require('./lib/worker')
var prettyjson = require('prettyjson')

// TODO: Print help
// if emp [ params ] [ directory  ]
// emp .

// TODO: Check if it's configured
// Configure
// - data path
// - ssh credentials
// - tmp sessions path

var args = process.argv

if (args.length > 2) {
  const code_dir = '/empirical/code'
  // Read experiment config
  var experiment_name = args[2]
  console.log('EXPERIMENT:')
  var experiment = emp.readExperimentConfig(code_dir, {
    name: experiment_name
  })
  console.log(prettyjson.render(experiment))
  // Build docker Image
  console.log('BUILD:')
  emp.buildImage(experiment.environment, code_dir, function (data) {
    process.stdout.write(data)
  })
  // Get dataset
  .then(function () {
    console.log('DATASET:')
    return emp.getDataset(code_dir, experiment.dataset).then(function (data) {
      if (!data) console.log('No dataset provided')
      console.log(prettyjson.render(data))
    })
  })
  // Run experiment
  .then(function () {
    console.log('RUN:')
    return emp.runExperiment(experiment)
  }).then(function () {
    console.log('SUCCESS!')
  }).catch(function (err) {
    console.log(err)
    console.log('EXPERIMENT FAILED!')
  })
} else {
  worker.consumeTasks().catch(emp.handleError)
}

