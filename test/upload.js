/* eslint-env mocha */

const dir = 'node_modules/fixtures'
const assert = require('assert')
const path = require('path')
const fs = require('fs')

describe('upload files', function () {
  const uploader = require('../lib/upload-directory')
  const ignores = ['README.md']
  var assets
  it('list all files and directories', function (done) {
    this.timeout(10000)
    uploader('empirical-bot/my-solver/x/myBuild', dir, ignores).then(function (files) {
      assets = files
      assert.equal(files.length, 10)
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

describe('push()', function () {
  const push = require('../lib/push')
  it('pushes a report to the server', function (done) {
    push(`empirical-bot/my-solver`, './test/fixtures/test-report', 'Great experiment!!! :D').then(function () {
      done()
    }).catch(done)
  })
  it('fails to push a report for non-existent project with force=false', function (done) {
    push(`empirical-bot/someProject`, './test/fixtures/test-report', 'Great experiment!!! :D', false).then(function () {
      done(new Error('Should not have worked'))
    }).catch(function () {
      done()
    })
  })
  it('pushes a report and creates a project with force=true', function (done) {
    push(`empirical-bot/someProject`, './test/fixtures/test-report', 'Great experiment!!! :D', true).then(function () {
      done()
    }).catch(done)
  })
})
