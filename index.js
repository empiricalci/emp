var config = require('./config')
var emp = require('./lib')

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

// TODO: Get random id from the Request
// var session_id = req.session_id


var args = process.argv
var experiment = {}

if (args.length > 2) {
  experiment.cli_mode = true
  // Last argument should be a directory or URL
  // Get project dir or URL to repo
  var git_repo = args[args.length - 1]
  emp.createSessionDirs().then(function (dirs) {
    return emp.cloneRepository(git_repo, dirs.code).then(function () {
      return emp.buildImage(dirs.code, config.config_filename)
    }).then(function () {
      return emp.runExperiments(dirs.code, confg.config_filename)
    })
  })
  .catch(emp.handleError)
} else {
  console.log('IMPLEMENT WORKER MODE')
 // TODO: launch client mode
}


