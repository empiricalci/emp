var path = require('path')
var fs = require('fs')

exports.overall = function (experiment) {
  const results_file = path.join(process.env.WORKSPACES_PATH, experiment.id, 'overall.json')
  return new Promise(function (resolve, reject) {
    try {
      var results = JSON.parse(fs.readFileSync(results_file, 'utf8'))
      resolve(results)
    } catch (e) {
      if (e.code === 'ENOENT') return resolve(null)
      reject(e)
    }
  })
}
