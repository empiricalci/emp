
var fs = require('fs')

module.exports = function (file) {
  try {
    var data = JSON.parse(fs.readFileSync(file, 'utf8'))
    return data
  } catch (e) {
    if (e.code === 'ENOENT') return null
    throw e
  }
}

