
const docker = require('dockerise')
const client = require('empirical-client')
const debug = require('debug')('emp')

function runSolver (experiment, logHandler) {
  if (!experiment.evaluator) return Promise.reject('No evaluator defined')
  var solver = {
    image: experiment.environment.tag
  }
  return client.getBuild(experiment.evaluator).then(function (res) {
    if (!res.image) return Promise.reject('Evaluator does\'t specify an image')
    var evaluator = {
      image: res.image
    }
    logHandler('RUN SOLVER WITH EVALUATOR', solver.image, evaluator.image)
    // Pull and Run
    return docker.pull(evaluator.image, undefined, logHandler).then(function () {
      return docker.runLinked(solver, evaluator)
    }).then(function (containers) {
      console.log('Containers:', containers)
      // Cleanup
      return docker.remove(containers.client).then(function () {
        return docker.stop(containers.server).then(docker.remove)
      })
    })
  })
}

function runStandalone (experiment, logHandler) {
  var standalone = {
    image: experiment.environment.tag,
    binds: [
      `${process.env.DATA_PATH}:/data:ro`,
      `${process.env.WORKSPACES_PATH}/${experiment.id}:/workspace`
    ]
  }
  return docker.run(standalone, logHandler).then(function (res) {
    return docker.remove(res.container)
  })
}

module.exports = function (experiment, logHandler) {
  debug('runExperiment: %o', experiment)
  switch (experiment.type) {
    case 'evaluator':
      // Evaluator doesn't run experiments
      return Promise.resolve()
    case 'solver':
      return runSolver(experiment, logHandler)
    case 'standalone':
      return runStandalone(experiment, logHandler)
    default:
      return Promise.reject('Unknown experiment type:', experiment.type)
  }
}

