
const docker = require('dockerise')
const split = require('split2')

module.exports = function (image, code_dir, onData) {
  return docker.build(code_dir, image).then(function (stream) {
    return new Promise(function (resolve, reject) {
      if (!stream) return reject(new Error('buildImage failed: null stream'))
      stream.on('end', function () {
        resolve()
      }).on('error', reject)
      if (typeof onData === 'function') {
        stream.pipe(split(JSON.parse)).on('data', function (data) {
          onData(JSON.stringify(data))
          if (data.error) return reject(new Error(data.error))
        })
      }
    })
  })
}
