var emp = require('./lib')

// TODO: Get params from cli
var git_repo = 'git@github.com:alantrrs/emp'
var yml_file = 'empirical.yml'

// TODO: Get random id from the Request
// var session_id = req.session_id
emp.createSessionDirs().then(function (dirs) {
  return emp.cloneRepository(git_repo, dirs.code).then(function () {
    return emp.buildImage(dirs.code, yml_file)
  }).then(function () {
    return emp.runExperiments(dirs.code, yml_file)
  })
})
  .catch(emp.handleError)
