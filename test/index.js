/* eslint-env mocha */

var waitForIt = require('./wait-for-it')
var assert = require('assert')
var fs = require('fs')

// Test data
const test_standalone = {_id: '56fe1f7d4cd9176e48b5541f'}
const standalone_with_data = {_id: '573c1a1be041df2d00d5b96e'}
const test_solver = {_id: '56fe381a90031e0005d15ed8', full_name: 'empirical-bot/my-solver:VJsNP7PCe'}
const test_evaluator = {_id: '5719d236fe781303004ecea9'}

describe('Library', function () {
  var emp = require('../lib')
  it('should clone a repo into a temp directory', function (done) {
    this.timeout(300000)
    var repo = 'git@github.com:empiricalci/hello-world.git'
    var keys = {
      public_key: fs.readFileSync('./node_modules/fixtures/test_keys/test_key.pub', 'utf8'),
      private_key: fs.readFileSync('./node_modules/fixtures/test_keys/test_key', 'utf8')
    }
    var sha = 'a574f888bdb8f286fd827263794b8aace413dcec'
    emp.getCodeDir(repo, sha, keys).then(function (codeDir) {
      assert(fs.lstatSync(codeDir).isDirectory())
      done()
    }).catch(done)
  })
  describe('readExperimentConfig', function () {
    it('should succed with valid standalone config', function () {
      var experiment = emp.readExperimentConfig('./node_modules/fixtures/standalone_project', {
        _id: '342434234',
        project_name: 'hello-world',
        project_interface: 'standalone'
      })
      assert.equal(experiment.type, 'standalone')
      assert(experiment.environment.tag)
    })
    it('should fail if a solver experiment config does not contain evaluator')
  })
  it('should get a datset')
  describe('runExperiment', function () {
    it('should run a sandalone experiment', function (done) {
      emp.runExperiment({
        _id: 'some_id',
        type: 'standalone',
        environment: {
          tag: 'empiricalci/test_standalone'
        }
      }).then(function () {
        done()
      }).catch(done)
    })
  })
  it('should cleanup code and credentials')
})

describe('Server dependant tests', function () {
  before(function (done) {
    this.timeout(30000)
    waitForIt(process.env.EMPIRICAL_API_URI, done)
  })
  describe('Client', function () {
    var client = require('../lib/client')
    it('should update a build', function (done) {
      this.timeout(5000)
      client.updateBuild({
        _id: test_solver._id,
        status: 'success'
      }).then(function () {
        done()
      }).catch(done)
    })
    it('should get a build', function (done) {
      this.timeout(5000)
      client.getBuild(test_solver.full_name).then(function (build) {
        assert.equal(test_solver.full_name, build.full_name)
        done()
      }).catch(done)
    })
    it('should get project keys', function (done) {
      this.timeout(5000)
      client.getKeys('empirical-bot/my-solver').then(function (res) {
        assert(res.public_key)
        assert(res.private_key)
        done()
      }).catch(done)
    })
  })

  describe('runTask', function () {
    this.timeout(30000)
    var emp = require('../lib')
    emp.client.setAuth(
      '56fa1e9c444d666624705d15',
      '9b01c60c-56de-4ff2-8604-802c99f11d72'
    )
    it('should run a standalone experiment', function (done) {
      emp.runTask(test_standalone).then(function () {
        done()
      }).catch(done)
    })
    it('should run a standalone experiment with data', function (done) {
      emp.runTask(standalone_with_data).then(function () {
        done()
      }).catch(done)
    })
    it('should run a standalone experiment with output to workspace')
    it('should run an evaluator', function (done) {
      emp.runTask(test_evaluator).then(function () {
        done()
      }).catch(done)
    })
    it('should run a solver', function (done) {
      emp.runTask(test_solver).then(function () {
        done()
      }).catch(done)
    })
  })
})

describe('CLI', function () {
  it('should run a standalone experiment')
  it('should run a standalone experiment with data')
  it('should run a standalone experiment with output to workspace')
  it.skip('should build an evaluator')
  it.skip('should run an evaluato')
})

