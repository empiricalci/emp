
const docker = require('dockerise')

module.exports = function (image, code_dir, onData) {
  return docker.build(code_dir, image).then(function (stream) {
    return new Promise(function (resolve, reject) {
      if (!stream) return reject(new Error('buildImage failed: null stream'))
      stream.on('end', function () {
        resolve()
      }).on('error', reject)
      if (typeof onData === 'function') {
        stream.on('data', function (data) {
          // TODO: Parse json to render nice logs
          var dataStr = data.toString()
          onData(dataStr)
          var dataObj = JSON.parse(dataStr)
          if (dataObj.error) reject(new Error(`buildImage failed: ${dataObj.error}`))
        })
      }
    })
  })
}
