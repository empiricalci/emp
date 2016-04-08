/* eslint-env mocha */

var assert = require('assert')

var docker = require('../lib/docker')

describe('Docker', function () {
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
