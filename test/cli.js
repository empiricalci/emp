/* eslint-env mocha */

const spawn = require('child_process').spawn
const exec = require('child_process').exec
const assert = require('assert')
const setup = require('./setup')
const path = require('path')
const fs = require('fs')
// const debug = require('debug')('emp')

const ENV_FILE = path.join(process.env.HOME, '/.emp/emp.env')

before(function (done) {
  process.env.EMPIRICAL_HOST = 'http://localhost:1337'
  setup.backupConfig(ENV_FILE, done)
})

describe('emp configure', function () {
  const emp = spawn('node', ['./bin/cli.js', 'configure'])
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
  it('closes without failure', function (done) {
    emp.on('close', function (code) {
      assert.equal(code, 0)
      done()
    })
  })
  it('Fails if passed a non-absolute directory', function (done) {
    this.timeout(30000)
    const emp2 = spawn('node', ['./bin/cli.js', 'configure'])
    emp2.stdout.once('data', function (log) {
      emp2.stdin.write('node_modules/\n')
    })
    emp2.on('close', function (code) {
      assert.equal(code, 1)
      done()
    })
  })
})

describe('emp run', function () {
  it('runs the experiment', function (done) {
    this.timeout(60000)
    exec('node ./bin/cli.js run hello-world node_modules/fixtures/standalone_project', function (err, stdout, stderr) {
      if (err) return done(err)
      // TODO: Add assertions
      done()
    })
  })
  it('replicates experiment from empiricalci', function (done) {
    this.timeout(60000)
    exec('node ./bin/cli.js run empiricalci/mnist/x/mnistExperiment', function (err, stdout, stderr) {
      if (err) return done(err)
      // TODO: Add assertions
      done()
    })
  })
})

describe('emp data', function () {
  const test_url = 'https://raw.githubusercontent.com/empiricalci/fixtures/data.csv'
  const test_hash = '986915f2caa2c8f9538f0b77832adc8abf3357681d4de5ee93a202ebf19bd8b8'
  it('get url should save and log dataset', function (done) {
    exec('node ./bin/cli.js data get ' + test_url, function (err, stdout, stderr) {
      assert.ifError(err)
      assert(fs.lstatSync('/tmp/emp/data/' + test_hash).isFile())
      done()
    })
  })
  it('hash file should log the hash of the file', function (done) {
    exec(`node ./bin/cli.js data hash /tmp/emp/data/${test_hash}`, function (err, stdout, stderr) {
      assert.ifError(err)
      assert(stdout.indexOf(test_hash) > -1)
      done()
    })
  })
})

describe('emp login', function () {
  it('works with the right credentials', function (done) {
    const emp = spawn('node', ['./bin/cli.js', 'login'])
    emp.on('close', function (code) {
      assert.equal(code, 0)
      done()
    })
    emp.stdout.once('data', function (prompt) {
      emp.stdout.once('data', function (prompt2) {
        emp.stdin.write('empirical-bot\n')
        emp.stdout.once('data', function (prompt3) {
          emp.stdin.write('password\n')
          emp.stdout.once('data', function (prompt4) {
            assert.equal(prompt4.toString(), 'Logged in successfully. Credentials stored.\n')
          })
        })
      })
    })
  })
  it('failed with the wrong credentials', function (done) {
    const emp = spawn('node', ['./bin/cli.js', 'login'])
    emp.on('close', function (code) {
      assert.equal(code, 1)
      done()
    })
    emp.stdout.once('data', function (prompt) {
      emp.stdout.once('data', function (prompt2) {
        emp.stdin.write('empirical-bot\n')
        emp.stdout.once('data', function (prompt3) {
          emp.stdin.write('wrong password\n')
          emp.stdout.once('data', function (prompt4) {
            assert.equal(prompt4.toString(), 'Login failed. Wrong credentials.\n')
          })
        })
      })
    })
  })
})

describe('emp push', function () {
  it('uploads report & artifacts to the server', function (done) {
    this.timeout(60000)
    exec('node ./bin/cli.js push -m "Changed number of layers" test/fixtures/test-report empirical-bot/my-solver', function (err, stdout, stderr) {
      if (err) return done(err)
      // TODO: Add assertions
      done()
    })
  })
})

describe('emp logout', function () {
  it('clears credentials and logs confirmation', function (done) {
    exec('node ./bin/cli.js logout', function (err, stdout, stderr) {
      assert.equal(stdout, 'Logged out successfully. Credentials cleared.\n')
      assert.ifError(err)
      fs.readFile(ENV_FILE, 'utf8', function (err, content) {
        assert.ifError(err)
        assert(content.indexOf(`EMPIRICAL_AUTH=\"None\"`) > -1, 'Variable not saved')
        done()
      })
    })
  })
})

after(function (done) {
  const rm = require('rimraf')
  rm(path.join(process.cwd(), 'mnist'), function () {
    setup.resetConfig(ENV_FILE, done)
  })
})
