/* eslint-env mocha */

const assert = require('assert')
const fs = require('fs')

describe('pull', function () {
  const pull = require('../lib/pull')
  const testProject = {
    project: 'empiricalci/mnist-sample',
    private: true,
    head_sha: 'd539a5cc8fd0947470ccf3752a9dbd0f0d6e4e7a'
  }
  it('should pull a project using auth token', function (done) {
    pull(testProject).then(function (res) {
      assert(fs.lstatSync(res.code_path).isDirectory())
      done()
    }).catch(done)
  })
  describe('As admin', function () {
    // Set auth to admin
    before(function () {
      require('empirical-client').setAuth('empirical-tester', 'superman')
    })
    it('should pull a project using ssh keys', function (done) {
      var project = Object.assign({}, testProject, {auth_method: 'ssh'})
      pull(project).then(function (res) {
        assert(fs.lstatSync(res.code_path).isDirectory())
        done()
      }).catch(done)
    })
    // Back to regular user
    after(function () {
      require('empirical-client').setAuth('empirical-bot', 'password')
    })
  })
})
