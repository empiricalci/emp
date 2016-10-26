
const prettyjson = require('prettyjson')
const colors = require('colors/safe')
const fs = require('fs')
const os = require('os')

var options = {
  logfile: null,
  console: true
}

function logger (log) {
  if (options.console) console.log(log)
  if (options.logfile) fs.appendFileSync(options.logfile, log + os.EOL)
}

exports.writeToConsole = function (state) {
  options.console = state
}

exports.setLogFile = function (logfile) {
  options.logfile = logfile
}

exports.section = function (title) {
  logger(colors.white.bold(title))
}

exports.write = function (log) {
  if (options.console) process.stdout.write(log)
  if (options.logfile) fs.appendFileSync(options.logfile, log)
}

exports.json = function (json) {
  logger(prettyjson.render(json))
}

exports.error = function (err) {
  logger(colors.red.bold(err))
}

exports.log = function (log) {
  logger(log)
}

