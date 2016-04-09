/* eslint-env mocha */

var assert = require('assert')
var fetch = require('node-fetch')

function onProgress (data) {
  console.log(data)
}

var docker = require('../lib/docker')
describe('Docker', function () {
  it('should pull', function (done) {
    this.timeout(20000)
    docker.pull('empiricaladmin/true')
    .then(function (data) {
      done()
    }).catch(function (err) {
      done(err)
    })
  })
  it('should push an image', function (done) {
    this.timeout(10000)
    docker.push('empiricaladmin/true')
    .then(function (data) {
      done()
    }).catch(function (err) {
      done(err)
    })
  })
})

var client = require('../lib/client')

describe('Client', function () {
  before(function (done) {
    this.timeout(30000)
    function waitForIt() {
      return fetch(process.env.EMPIRICAL_API_URI).then(function (res) {
        return done()
      }).catch(function (err) {
        setTimeout(waitForIt,2000)
      })
    }
    waitForIt()
  })
  it('updates a build', function (done) {
    client.updateBuild({
      _id : "56f5da4e49b2e7531469c3ef",
      status: 'success'
    }).then(function () {
      done()
    }).catch(done)
  })
  it('gets project keys', function (done) {
    client.getKeys('/tmp', 'empirical-bot', 'my-solver').then(function (res) {
      assert(res.public_key)
      assert(res.private_key)
      done()
    }).catch(done)
  })
})
