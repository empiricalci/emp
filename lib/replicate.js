
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
    if (!codePath) codePath = path.join(process.cwd(), experiment.id)
    logger.section('PULL:')
    return pull({
      code_path: codePath,
      repo: experiment.source.repo,
      commit: experiment.source.commit
    }).then(function (data) {
      logger.log(`Cloned repo to ${data.code_path}`)
      return run({
        protocol: experiment.project_id.split('/').pop(),
        code_path: codePath
      }, logger)
    })
  })
}
