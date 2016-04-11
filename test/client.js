/* eslint-env mocha */

var assert = require('assert')
var fetch = require('node-fetch')

function waitForIt (done) {
  return fetch(process.env.EMPIRICAL_API_URI).then(function (res) {
    return done()
  }).catch(function () {
    setTimeout(function () {
      waitForIt(done)
    }, 2000)
  })
}

describe('Client', function () {
  var client = require('../lib/client')
  before(function (done) {
    this.timeout(30000)
    waitForIt(done)
  })
  it('updates a build', function (done) {
    client.updateBuild({
      _id: '56f5da4e49b2e7531469c3ef',
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

describe('emp', function () {
  var emp = require('../lib')
  var builds = require('./builds.json')
  before(function (done) {
    this.timeout(30000)
    waitForIt(done)
  })
  it('builds an evaluator', function (done) {
    this.timeout(60000)
    emp.runTask(builds.evaluator).then(function () {
      // TODO: Assert the image exists
      done()
    }).catch(done)
  })
  it.skip('builds and run a standalone experiment')
  it('builds and run a solver experiment', function (done) {
    this.timeout(10000)
    emp.runTask(builds.solver).then(function () {
      // TODO: assert the image exists
      // TODO: assert the results are updated correctly
      done()
    }).catch(done)
  })
})

