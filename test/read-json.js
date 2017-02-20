/* eslint-env mocha */

const readJSON = require('../lib/read-json')
const assert = require('assert')

describe('readJSON()', function () {
  it('should return an object from a json file', function () {
    var json = readJSON('test/fixtures/standalone_project/overall.json')
    assert(typeof json === 'object')
  })
  it('should return nul if non-existent file', function () {
    var json = readJSON('test/fixtures/standalone_project/not_Exists')
    assert.equal(json, null)
  })
})

