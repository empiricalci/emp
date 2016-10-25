/* eslint-env mocha */

describe('run() gpu experiment', function () {
  this.timeout(300000)
  const run = require('../lib/run')
  const logger = require('../lib/logger')
  const config = require('../lib/config')
  it('should be able to access the gpu', function (done) {
    config.load().then(function () {
      run({
        protocol: 'nvidia-test',
        code_path: './test/fixtures/gpu-experiment'
      }, logger).then(function () {
        done()
      }).catch(done)
    })
  })
})

