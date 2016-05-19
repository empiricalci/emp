
var emp = require('./lib')
var worker = require('./lib/worker')

// TODO: Print help
// if emp [ params ] [ directory | git url ]
// if directory is empty then emp is run as a worker and will connect to empirical.com to wait for tasks
// emp .
// emp git@github:alantrrs/emp
// emp --configure to configure

// TODO: Check if it's configured
// Configure
// - data path
// - ssh credentials
// - tmp sessions path

var args = process.argv

if (args.length > 2) {
  console.log(args)
  const code_dir = '/empirical/code'
  // Read experiment config
  var experiment_name = args[2]
  var experiment = emp.readExperimentConfig(code_dir, {
    project_name: experiment_name
  })
  // Build docker Image
  emp.buildImage(experiment.environment, code_dir)
  // Get dataset
  .then(function () {
    return emp.getDataset(experiment.dataset).then(function (data) {
      if (!data) console.log('No dataset provided')
    })
  })
  // Run experiment
  .then(function () {
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

