
var config = require('../config')
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
      if (err) return reject(err)
      if (!stream) return reject({msg: 'DOCKER BUILD ERROR: null stream'})
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
    console.log(`${params.name}: Running container`)
    docker.run(
      params.image,
      params.command,
      [process.stdout, process.stderr], {
        name: params.name,
        Tty: false,
        Entrypoint: params.entrypoint,
        Env: params.env,
        HostConfig: {
          Links: params.links,
          Binds: params.binds
        }
      }, function (err, data, container) {
        console.log(`${params.name}: Finished running`)
        console.log('DATA:', data)
        console.log('CONTAINER:', container)
        if (err) return reject({err: err, msg: 'ERROR: docker run'})
        if (!container) return reject({err: 'UserError', msg: 'Image does not exist'})
        if (data.StatusCode) {
          return exports.remove(container).then(function () {
            reject({err: 'UserError', msg: `Evalutor failed with status ${data.StatusCode}`})
          })
        }
        resolve({container: container, data: data})
      }
    )
  })
}

exports.runLinked = function (solver, evaluator) {
  return new Promise(function (resolve, reject) {
    if (solver.command && !Array.isArray(solver.command)) {
      solver.command = solver.command.split(' ')
    }
    console.log(`${solver.name}: Running container`)
    docker.run(
      solver.image,
      solver.command,
      [process.stdout, process.stderr], {
        name: solver.name,
        Tty: false,
        Entrypoint: solver.entrypoint
      }, function (err, data, container) {
        console.log(`${solver.name}: Finished running`)
        console.log('DATA:', data)
        console.log('CONTAINER:', container)
        if (err) return reject({err: err, msg: 'ERROR: docker run'})
        if (data.StatusCode) return reject({err: 'UserError', msg: `Solver failed with status ${data.StatusCode}`})
        container.remove(function (err, data) {
          if (err) return reject({err: err, msg: 'ERROR: docker remove'})
        })
      }
    ).on('start', function (container) {
      console.log(`${solver.name}: Container started`)
      evaluator.links = [`${solver.name}:solver`]
      return exports.run(evaluator).then(function (res) {
        resolve({solver: container, evaluator: res.container})
      }).catch(function (err) {
        // TODO: If 404 pull the image first and retry
        console.log('ERROR RUNNING EVALUATOR:', err)
        // Inspect the container first to figure out its state
        return inspect(container).then(function () {
          // Stop and remove.
          exports.stop(container).then(exports.remove, function (err) {
            // Remove anyway if stop fails (probably cause already stopped)
            console.log('CONTAINER STOP ERROR:', err)
            return exports.remove(container)
          }).then(function () {
            reject(err)
          }).catch(reject)
        })
      })
    })
  })
}

var inspect = function (container) {
  return new Promise(function (resolve, reject) {
    container.inspect(function (err, data) {
      console.log('Inspect:', data.State)
      if (err) return reject(err)
      resolve(container)
    })
  })
}

exports.stop = function (container) {
  return new Promise(function (resolve, reject) {
    container.stop(function (err, data) {
      console.log('stopping container', container.id)
      console.log('stop data:', data)
      if (err) return reject(err)
      resolve(container)
    })
  })
}

exports.remove = function (container) {
  return new Promise(function (resolve, reject) {
    container.remove(function (err, data) {
      console.log('removing container', container.id)
      console.log('remove data:', data)
      console.log('remove err:', err)
      // CircleCI doesn't allow removing containers. This avoids error
      // See https://github.com/portertech/kitchen-docker/issues/98#issuecomment-80786250
      // https://discuss.circleci.com/t/docker-error-removing-intermediate-container/70
      if (process.env.CIRCLECI) return resolve(data)
      if (err) return reject(err)
      resolve(data)
    })
  })
}

const authconfig = config.registry.key ? {key: config.registry.key} : config.registry

exports.pull = function (image_name, onProgress) {
  return new Promise(function (resolve, reject) {
    docker.pull(image_name, {
      authconfig: authconfig
    }, function (err, stream) {
      if (err) return reject(err)
      docker.modem.followProgress(stream, function (err, data) {
        if (err) return reject(err)
        resolve(data)
      }, onProgress)
    })
  })
}

exports.push = function (image_name, onProgress) {
  return new Promise(function (resolve, reject) {
    var image = docker.getImage(image_name)
    image.push({
      authconfig: authconfig
    }, function (err, stream) {
      if (err) return reject(err)
      docker.modem.followProgress(stream, function (err, data) {
        if (err) return reject(err)
        resolve(data)
      }, onProgress)
    })
  })
}
