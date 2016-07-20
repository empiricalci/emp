
const cache = require('dataset-cache')
const prettyjson = require('prettyjson')
const config = require('../config')

function get (url) {
  return cache.get({url: url}, config.data_dir).then(function (data) {
    // Show source url
    data.url = url
    // Modify to host path
    data.path = `${config.HOST_DIR}/data/${data.hash}`
    // Don't display unecessary variables
    delete data.valid
    delete data.cached
    console.log(prettyjson.render(data))
  })
}

function hash (path) {
  return cache.hash(path).then(function (hash) {
    console.log(`${path.replace('/x', '')}\t${hash}`)
  })
}

module.exports = function (subcommand) {
  switch (subcommand) {
    case 'get':
      return get(process.argv[4]).catch(function (err) {
        console.log('ERROR:', err)
      })
    case 'hash':
      return hash(process.env.DATA_FILE).catch(function (err) {
        console.log('ERROR:', err)
      })
    default:
      console.log('Usage: emp data subcommand [args]')
  }
}

