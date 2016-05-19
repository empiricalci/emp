/* eslint-env mocha */

var docker = require('../lib/docker')
describe('Docker', function () {
  it('should pull', function (done) {
    this.timeout(20000)
    docker.pull('empiricaladmin/true')
    .then(function (data) {
      done()
    }).catch(function (err) {
      done(err)
    })
  })
  it('should push an image', function (done) {
    this.timeout(10000)
    docker.push('empiricaladmin/true')
    .then(function (data) {
      done()
    }).catch(function (err) {
      done(err)
    })
  })
  it('runs with a volume attached')
})

