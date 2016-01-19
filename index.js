
var emp = require('./lib')
var client = require('./lib/client')

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

if (args.length > 2) {
  var git_repo = args[args.length - 1]
  client.runTask({
    cli_mode: true,
    ssh_url: git_repo
  }).catch(emp.handleError)
} else {
  client.consumeTasks()
}

