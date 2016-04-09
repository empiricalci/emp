/* eslint-env mocha */

var assert = require('assert')
var fetch = require('node-fetch')

var docker = require('../lib/docker')

function onProgress (data) {
  console.log(data)
}

before(function (done) {
  // Wait for the server to be up
  this.timeout(60000)
  console.log('Waiting for the server to be up')
  function waitForIt() {
    console.log('.')
    return fetch(process.env.EMPIRICAL_API_URI).then(function (res) {
      if (res.ok) return done()
      setTimeout(waitForIt,2000)
    }).catch(function (err) {
      setTimeout(waitForIt,2000)
    })
  }
  waitForIt()
})

describe('Docker', function () {
  it('should pull', function (done) {
    this.timeout(20000)
    docker.pull('tianon/true')
    .then(function (data) {
      done()
    }).catch(function (err) {
      done(err)
    })
  })
  // TODO: Get a small image and re-tag it first to test this
  it.skip('should push an image', function (done) {
    this.timeout(10000)
    docker.push('empiricaladmin/empirical-bot-my-solver')
    .then(function (data) {
      done()
    }).catch(function (err) {
      done(err)
    })
  })
})

var client = require('../lib/client')

describe('Client', function () {
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
