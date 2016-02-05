var Docker = require('dockerode')
var tar = require('tar-fs')
var path = require('path')

var docker = new Docker({socketPath: '/var/run/docker.sock'})

// TODO: Exclude .dockerignore and .gitignore patterns from context
exports.build = function (code_dir, params) {
  // FIXME: make sure build path is not outside the code_dir
  var context = path.resolve(code_dir, params.build)
  var query = {t: params.tag, dockerfile: params.dockerfile}
  return new Promise(function (resolve, reject) {
    docker.buildImage(tar.pack(context), query, function (err, stream) {
      if (err) reject(err)
      // TODO: pass callbacks for stdout and stderr
      stream.pipe(process.stdout, {end: true})
      stream.on('end', function () {
        params.image = params.tag
        resolve(params)
      })
    })
  })
}

/* dockerode.run params
 * - image
 * - cmd
 * - streams
 * - create_options (optional)
 * - start_options (optional)
 * - callback
 */
// TODO: Mount workspace and data volumes
exports.run = function (params) {
  return new Promise(function (resolve, reject) {
    if (params.command && !Array.isArray(params.command)) {
      params.command = params.command.split(' ')
    }
    docker.run(
      params.image,
      params.command,
      [process.stdout, process.stderr], {
        Tty: false,
        Entrypoint: params.entrypoint
      }, function (err, data, container) {
        if (err) return reject(err)
        container.remove(function (err, data) {
          if (err) return reject(err)
          resolve(data)
        })
      }
    )
  })
}
