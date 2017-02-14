
const client = require('empirical-client')
const run = require('./run')

/**
 * Gets experiment data, clones the repo and runs the experiment
 * @param {String} experimentId
 * @param {String} [codePath] - Directory to download the repo contents
 */

module.exports = function (experimentId, logger) {
  return client.getExperiment(experimentId).then(function (experiment) {
    return run({
      protocol: experiment.protocol,
      code_path: `${experiment.source.repo}#${experiment.source.commit}`
    }, logger)
  })
}
