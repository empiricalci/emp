// Hopefully this can be replaced by a real node lib

var exec = require('child_process').exec

var compose = function (cwd, opts) {
  var cmd = 'docker-compose'
  if (opts.file) cmd = cmd + ' -f ' + opts.file
  cmd = cmd + ' ' + opts.command
  var cmd_opts = opts.options
  if (cmd_opts) {
    if (cmd_opts.force_rm) cmd += '--force-rm '
    if (cmd_opts.no_cache) cmd += ' --no-cache '
    if (cmd_opts.pull) cmd += ' --pull '
    if (cmd_opts.service) cmd += opts.service
  }
  return new Promise(function (resolve, reject) {
    exec(cmd, {cwd: cwd}, function (err, stdout, sterr) {
      if (err) return reject(err)
      console.log(stdout)
      resolve(stdout)
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
