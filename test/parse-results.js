/* eslint-env mocha */

const assert = require('assert')
const workDir = 'test/fixtures/test-report'
const goodResults = {
  'some-result': {
    type: 'table',
    data: 'accuracy.json'
  },
  'other-result': {
    type: 'table',
    title: 'Sfddsfsdf',
    data: 'accuracy.json'
  }
}

const badData = {
  badTable: {
    type: 'table',
    data: 'bad-data.json'
  }
}

describe('parseResults()', function () {
  const parseResults = require('../lib/parse-results')
  it('should return an array of the results', function () {
    var results = parseResults(goodResults, workDir)
    assert.equal(results.length, 2)
  })
  it('should throw error if result is not valid', function () {
    try {
      parseResults(badData, workDir)
    } catch (e) {
      assert.equal(e.message, '[badTable][data]: All rows must have the same number of columns')
    }
  })
})
