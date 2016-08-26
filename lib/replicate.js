
const client = require('empirical-client')
const path = require('path')
const pull = require('./pull')
const run = require('./run')

/**
 * Gets experiment data, clones the repo and runs the experiment
 * @param {String} experimentId
 * @param {String} [codePath] - Directory to download the repo contents
 */

module.exports = function (experimentId, codePath, logger) {
  return client.getExperiment(experimentId).then(function (experiment) {
    if (!codePath) codePath = path.join(process.cwd(), experiment.protocol.name)
    logger.section('PULL:')
    return pull({
      project: experiment.protocol.project_id,
      code_path: codePath,
      head_sha: experiment.version.head_sha
    }).then(function (data) {
      logger.log(`Cloned repo to ${data.code_path}`)
      return run({
        protocol: experiment.protocol.name,
        code_path: codePath
      }, logger)
    })
  })
}
