/* eslint-env mocha */

const dir = 'test/fixtures/standalone_project'
const assert = require('assert')
const path = require('path')
const fs = require('fs')

describe('upload files', function () {
  const uploader = require('../lib/upload-directory')
  const ignores = ['README.md']
  var assets
  it('list all files and directories', function (done) {
    this.timeout(20000)
    uploader('empirical-bot/my-solver/x/myBuild', dir, ignores).then(function (files) {
      assets = files
      assert.equal(files.length, 3)
      done()
    }).catch(done)
  })
  it('Packages all directories', function () {
    assert(assets)
    assets.forEach(function (asset) {
      if (asset.directory) {
        assert(fs.lstatSync(asset.path).isDirectory())
        assert(fs.lstatSync(asset.pkg_path).isFile())
      }
    })
  })
  it('Ignores defined assets', function () {
    assert(assets)
    assets.filter(function (f) {
      assert(f.path !== path.join(dir, ignores[0]))
    })
  })
})

describe('postResults()', function () {
  const postResults = require('../lib/post-results')
  it('posts the results and returns status', function (done) {
    postResults('empirical-bot/my-solver/x/myBuild', './test/fixtures/test-report', {
      myImage: {
        type: 'image',
        title: 'Some cool title',
        data: 'robot.png'
      },
      'dum-dummy': {
        type: 'table',
        title: 'Dummy table',
        data: 'accuracy.json'
      }
    }).then(function (results) {
      assert.equal(results[0].name, 'myImage')
      assert.equal(results[0].status, 'success')
      assert.equal(results[1].name, 'dum-dummy')
      assert.equal(results[1].status, 'success')
      done()
    }).catch(done)
  })
})

describe('push()', function () {
  const push = require('../lib/push')
  this.timeout(10000)
  it('pushes a report to the server', function (done) {
    push(`empirical-bot/my-solver`, './test/fixtures/test-report', {message: 'Great experiment!!! :D'}).then(function () {
      done()
    }).catch(done)
  })
  it('fails to push a report for non-existent project with force=false', function (done) {
    push(`empirical-bot/someProject`, './test/fixtures/test-report', {
      message: 'Great experiment!!! :D',
      force: false
    }).then(function () {
      done(new Error('Should not have worked'))
    }).catch(function () {
      done()
    })
  })
  it('pushes a report and creates a project with force=true', function (done) {
    push(`empirical-bot/someProject`, './test/fixtures/test-report', {
      message: 'Great experiment!!! :D',
      force: true
    }).then(function () {
      done()
    }).catch(done)
  })
  it('Catches 409 error when creating a duplicate project', function (done) {
    push(`empirical-bot/someProject`, './test/fixtures/test-report', {
      message: 'Great experiment!!! :D',
      force: true
    }).then(function () {
      done()
    }).catch(done)
  })
})
