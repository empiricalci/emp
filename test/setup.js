
var fs = require('fs')

// Renames the current config file if it exists
exports.backupConfig = function (ENV_FILE, done) {
  fs.lstat(ENV_FILE, function (err, stats) {
    if (err) return done()
    if (stats.isFile()) {
      fs.rename(ENV_FILE, `${ENV_FILE}.bak`, function (err) {
        if (err) return done(err)
        done()
      })
    } else {
      done()
    }
  })
}

// Switches back to the original config file
exports.resetConfig = function (ENV_FILE, done) {
// Remove newly created ENV_FILE
  fs.unlinkSync(ENV_FILE)
  // Move original config file if back, if it exists
  fs.lstat(`${ENV_FILE}.bak`, function (err, stats) {
    if (err) return done()
    if (stats.isFile()) {
      fs.rename(`${ENV_FILE}.bak`, ENV_FILE, function (err) {
        if (err) return done(err)
        done()
      })
    } else {
      done()
    }
  })
}
