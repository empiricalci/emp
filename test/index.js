/* eslint-env mocha */

var assert = require('assert')
var fetch = require('node-fetch')

function onProgress (data) {
  console.log(data)
}

function waitForIt(done) {
  return fetch(process.env.EMPIRICAL_API_URI).then(function (res) {
    return done()
  }).catch(function (err) {
    setTimeout(function () {
      waitForIt(done)
    },2000)
  })
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

describe('Client', function () {
  var client = require('../lib/client')
  before(function (done) {
    this.timeout(30000)
    waitForIt(done)
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

describe('emp', function () {
  var emp = require('../lib')
  before(function (done) {
    this.timeout(30000)
    waitForIt(done)
  })
  it.skip('builds an evaluator')
  it.skip('builds and run a standalone experiment')
  it('builds and run a solver experiment', function (done) {
    var task = require('./build.json')
    emp.runTask(task).then(function() {
      done()
    }).catch(done)
  })
})

