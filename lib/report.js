
const YAML = require('yamljs')
const fs = require('fs')
const path = require('path')

const reportFileName = 'experiment.report.yml'

exports.fileName = reportFileName

exports.write = function (dir, data) {
  // Set defaults
  data.logs = data.logs || 'experiment.log'
  fs.writeFileSync(path.join(dir, reportFileName), YAML.stringify(data, 4))
}

exports.read = function (dir) {
  return YAML.load(path.join(dir, reportFileName))
}
