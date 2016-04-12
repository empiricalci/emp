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

var emp = require('../lib')
var client = emp.client
var git = emp.git

var builds = require('./builds.json')

describe('EMP', function () {
  before(function (done) {
    this.timeout(30000)
    waitForIt(done)
  })
  var test_build = builds.solver
  it('client updates a build', function (done) {
    this.timeout(5000)
    client.updateBuild({
      _id: test_build._id,
      status: 'success'
    }).then(function () {
      done()
    }).catch(done)
  })
  var keys
  it('client gets project keys', function (done) {
    this.timeout(5000)
    client.getKeys('/tmp', test_build.project_owner, test_build.project_name).then(function (res) {
      assert(res.public_key)
      assert(res.private_key)
      keys = res
      done()
    }).catch(done)
  })
  it('git clones a repository', function (done) {
    this.timeout(300000)
    git.cloneRepository(
      test_build.ssh_url,
      keys,
      test_build.head_sha,
      '/tmp/' + test_build._id
    ).then(function (repo) {
      repo.getHeadCommit().then(function (commit) {
        assert.equal(test_build.head_sha, commit.sha())
        done()
      })
    }).catch(done)
  })
  it.skip('reads experiment config')
  it.skip('create sessions directories')
  it.skip('builds image')
  it.skip('run standalone experiment')
  it.skip('run solver experiment')
  it.skip('logs')
  // TODO: Get a standalone experiment of the right
  it.skip('builds and run a standalone experiment', function (done) {
    this.timeout(300000)
    // user key/secret for admin user
    emp.client.setAuth(
      '56fa1e9c444d666624705d15',
      '9b01c60c-56de-4ff2-8604-802c99f11d72'
    )
    emp.runTask(builds.standalone).then(function () {
      done()
    }).catch(done)
  })
})

