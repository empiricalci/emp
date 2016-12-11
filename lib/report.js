
const YAML = require('yamljs')
const fs = require('fs')
const path = require('path')

exports.write = function (dir, data) {
  const fileName = 'experiment.report.yml'
  // Set defaults
  data.logs = data.logs || 'empirical.log'
  fs.writeFileSync(path.join(dir, fileName), YAML.stringify(data))
}
