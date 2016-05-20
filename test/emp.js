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

// Test data
var builds = require('../node_modules/fixtures/builds.json')
var test_solver = builds[0]
test_solver.full_name = `${test_solver.project_owner}/${test_solver.project_name}:${test_solver.label}`
var test_evaluator = builds[3]
test_evaluator.full_name = `${test_evaluator.project_owner}/${test_evaluator.project_name}:${test_evaluator.label}`
var test_dir = '/tmp/' + test_solver._id

// Lib
var emp = require('../lib')
var client = emp.client
var git = emp.git

describe('EMP:', function () {
  before(function (done) {
    this.timeout(30000)
    waitForIt(done)
  })
  it('client updates a build', function (done) {
    this.timeout(5000)
    client.updateBuild({
      _id: test_solver._id,
      status: 'success'
    }).then(function () {
      done()
    }).catch(done)
  })
  it('client gets a build', function (done) {
    this.timeout(5000)
    client.getBuild(test_solver.full_name).then(function (build) {
      assert.equal(test_solver.full_name, build.full_name)
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
  describe.skip('Evaluator', function () {
    it('checkouts, builds and push the image', function (done) {
      this.timeout(300000)
      emp.runTask(test_evaluator).then(function () {
        done()
      }).catch(done)
    })
  })
  describe('Solver', function () {
    it.skip('fails if it does not contain evaluator')
    var experiment
    it('validates experiment config', function () {
      experiment = emp.readExperimentConfig(test_dir, test_solver)
      assert.equal(experiment.type, 'solver')
      assert(experiment.evaluator)
      assert(experiment.environment.tag)
    })
    it('builds image', function (done) {
      this.timeout(300000)
      emp.buildImage(experiment.environment, test_dir).then(function () {
        // TODO: Assert image exists
        done()
      }).catch(done)
    })
    it('run solver experiment', function (done) {
      this.timeout(300000)
      emp.runExperiment(test_solver).then(function () {
        // TODO: Assert results?
        done()
      }).catch(done)
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
    it('should be able to consume data from /data')
    it('writing to /data should fail as it is read-only')
  })
  it.skip('logs')
  after(function (done) {
    rimraf(test_dir, done)
  })
})

