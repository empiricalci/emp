/* eslint-env mocha */

const spawn = require('child_process').spawn
const exec = require('child_process').exec
const assert = require('assert')
// const debug = require('debug')('emp')

describe('emp configure', function () {
  const emp = spawn('./bin/run.sh', ['configure'])
  emp.stderr.on('data', function (err) {
    console.log(err.toString())
  })
  it('prompts to change the default empirical directory', function (done) {
    this.timeout(30000)
    function handler (data) {
      assert.equal(data.toString(), `Empirical directory [${process.env.HOME}/empirical]: `)
      emp.stdout.removeListener('data', handler)
      done()
    }
    emp.stdout.once('data', handler)
  })
  it('receives the new empirical directory from stdin', function (done) {
    this.timeout(30000)
    emp.stdin.write('/tmp/emp\n')
    function handler (data) {
      assert.equal(data.toString(), 'Saved new empirical directory: /tmp/emp\n')
      done()
    }
    emp.stdout.once('data', handler)
  })
  it('Fails if passed a non-absolute directory')
})

describe('emp run', function () {
  it('runs the experiment', function (done) {
    this.timeout(60000)
    exec('./bin/run.sh run hello-world node_modules/fixtures/standalone_project', function (err, stdout, stderr) {
      if (err) return done(err)
      console.log(stdout)
      done()
    })
  })
})

// TODO: Test install script
