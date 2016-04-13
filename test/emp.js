/* eslint-env mocha */

var assert = require('assert')
var fetch = require('node-fetch')
var rimraf = require('rimraf')

function waitForIt (done) {
  return fetch(process.env.EMPIRICAL_API_URI).then(function (res) {
    return done()
  }).catch(function () {
    setTimeout(function () {
      waitForIt(done)
    }, 2000)
  })
}

var emp = require('../lib')
var client = emp.client
var git = emp.git

var builds = require('./builds.json')

describe('EMP:', function () {
  before(function (done) {
    this.timeout(30000)
    waitForIt(done)
  })
  var test_solver = builds.solver
  var test_dir = '/tmp/' + test_solver._id
  it('client updates a build', function (done) {
    this.timeout(5000)
    client.updateBuild({
      _id: test_solver._id,
      status: 'success'
    }).then(function () {
      done()
    }).catch(done)
  })
  var keys
  it('client gets project keys', function (done) {
    this.timeout(5000)
    client.getKeys('/tmp', test_solver.project_owner, test_solver.project_name).then(function (res) {
      assert(res.public_key)
      assert(res.private_key)
      keys = res
      done()
    }).catch(done)
  })
  it('git clones a repository', function (done) {
    this.timeout(300000)
    git.cloneRepository(
      test_solver.ssh_url,
      keys,
      test_solver.head_sha,
      test_dir
    ).then(function (repo) {
      repo.getHeadCommit().then(function (commit) {
        assert.equal(test_solver.head_sha, commit.sha())
        done()
      })
    }).catch(done)
  })
  it.skip('create sessions directories')
  describe('Solver', function () {
    it.skip('fails if it does not contain evaluator')
    it('validates experiment config', function () {
      var experiment = emp.readExperimentConfig(test_dir, test_solver)
      assert.equal(experiment.type, 'solver')
      assert(experiment.evaluator)
      assert(experiment.environment.tag)
    })
    it.skip('builds image')
    it.skip('run solver experiment', function (done) {
      emp.runExperiment(test_solver)
    })
  })
  describe('Standalone', function () {
    it.skip('gets build', function (done) {
      // user key/secret for admin user
      emp.client.setAuth(
        '56fa1e9c444d666624705d15',
        '9b01c60c-56de-4ff2-8604-802c99f11d72'
      )
    })
    it.skip('validates experiment config')
    it.skip('builds image')
    it.skip('runs experiment')
  })
  describe('Evaluator', function () {
    it.skip('validates experiment config')
    it.skip('builds image')
  })
  it.skip('logs')
  after(function (done) {
    rimraf(test_dir, done)
  })
})

