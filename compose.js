// Hopefully this can be replaced by a real node lib

var child_process = require('child_process')
var spawn = child_process.spawn

var compose = function (cwd, opts, onOut, onErr) {
  var args = ['-f', opts.file, opts.command]
  if (opts.command === 'run') args.push(opts.service)
  const docker = spawn('docker-compose', args, {cwd: cwd})
  // Pass the docker-compose.yml as a string
  docker.stdin.write(opts.file)
  docker.stdin.end()
  // Hook callbacks
  docker.stdout.on('data', onOut)
  docker.stderr.on('data', onErr)
  return new Promise(function (resolve, reject) {
    docker.on('close', function (code) {
      if (code !== 0) return reject(code)
      resolve()
    })
  })
}

module.exports = compose

// TODO: Check if docker-compose exists and is valid
// exports.isInstalled

/* TODO: Add options for
kill
logs
pause
port
ps
pull
restart
rm
run
scale
start
stop
unpause
up
*/
