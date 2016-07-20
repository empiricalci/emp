
var fetch = require('node-fetch')

function waitForIt (url, done) {
  return fetch(url).then(function (res) {
    return done()
  }).catch(function () {
    setTimeout(function () {
      waitForIt(url, done)
    }, 2000)
  })
}

module.exports = waitForIt
