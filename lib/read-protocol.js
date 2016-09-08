
const YAML = require('yamljs')
const path = require('path')
const shortid = require('shortid')

module.exports = function (code_dir, protocol) {
  var yml = YAML.load(path.resolve(code_dir, 'empirical.yml'))
  var experiment = yml.protocols[protocol]
  if (!experiment) return null
  // Read dataset from json file
  if (typeof experiment.dataset === 'string') {
    experiment.dataset = require(path.resolve(code_dir, experiment.dataset))
  }
  // Attach random id
  experiment.id = `${protocol}-${shortid.generate()}`
  // Default experiment type is standalone
  if (!experiment.type) experiment.type = 'standalone'
  experiment.environment.tag = `${protocol}`
  return experiment
}
