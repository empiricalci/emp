/* eslint-env mocha */

const assert = require('assert')
const path = require('path')
const spawn = require('child_process').spawn
const Docker = require('dockerode')
const docker = new Docker()
const env = require('node-env-file')
const fs = require('fs')
const setup = require('./setup')
const debug = require('debug')('emp')

const ENV_FILE = `${process.env.HOME}/.emp/emp.env`
console.log('ENV_FILE:', ENV_FILE)
console.log('CWD:', process.cwd())
console.log('DEBUG:', process.env.DEBUG)

function getContainer (image, cmd, cb) {
  docker.listContainers(function (err, containers) {
    if (err) console.log(err)
    debug('%o', containers)
    var emp_info = containers.find(function (info) {
      return (info.Image === image && info.Command === cmd)
    })
    assert(emp_info)
    // API 1.24 provides Mounts in the list
    // but API 1.22 doesn't so we need to inspect
    docker.getContainer(emp_info.Id).inspect(function (err, info) {
      debug('err: %o', err)
      debug('info: %o', info)
      assert(info.Mounts)
      cb(info)
    })
  })
}

function testMount (container, hostPath, mode) {
  var vol = container.Mounts.find(function (volume) {
    return (volume.Source === path.resolve(process.cwd(), hostPath))
  })
  assert(vol)
  assert.equal(vol.Source, vol.Destination)
  assert.equal(vol.Mode, mode || '')
  if (mode === 'ro') {
    assert(!vol.RW)
  } else {
    assert(vol.RW)
  }
}

before(function (done) {
  process.env.EMPIRICAL_HOST = 'http://localhost:1337'
  setup.backupConfig(ENV_FILE, done)
})

describe('./bin/run.sh', function () {
  describe('run ARGS', function () {
    this.timeout(20000)
    const code_path = './node_modules/fixtures/standalone_project'
    const abs_path = path.resolve(process.cwd(), code_path)
    var container
    it('runs and exits successfully', function (done) {
      const emp = spawn('./bin/run.sh', ['run', 'hello-world', code_path])
      emp.stdout.once('data', function (data) {
        debug(data.toString())
        env(ENV_FILE)
        debug('EMPIRICAL_DIR:', process.env.EMPIRICAL_DIR)
        getContainer('empiricalci/emp:test', `node index.js run hello-world ${abs_path}`, function (info) {
          container = info
        })
      })
      emp.stdout.on('data', function (data) {
        debug(data.toString())
      })
      emp.stderr.on('data', function (data) {
        console.log(data.toString())
      })
      emp.on('close', function (code) {
        if (code) return done(new Error('Failed'))
        done()
      })
    })
    it('mounts code directory as read-only', function () {
      testMount(container, code_path, 'ro')
    })
    // Common tests
    it('mounts environment config file', function () {
      testMount(container, ENV_FILE)
    })
    it('mounts the docker socket', function () {
      testMount(container, '/var/run/docker.sock')
    })
    it('mounts the workspaces directory', function () {
      testMount(container, `${process.env.EMPIRICAL_DIR}/workspaces`)
    })
    it('mounts the data directory', function () {
      testMount(container, `${process.env.EMPIRICAL_DIR}/data`)
    })
    it('passes $HOME')
  })
  describe('login', function () {
    it('authenticates and saves the credentials', function (done) {
      const emp = spawn('./bin/run.sh', ['login'])
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
  })
  describe('emp run --save <owner/project> <protocol> <path>', function (done) {
    var container
    const code_path = '/tmp/mnist-test-project'
    it('runs and exits successfully', function (done) {
      this.timeout(60000)
      const emp = spawn('./bin/run.sh', ['run', '--save', 'empiricalci/mnist-sample', 'mnist', code_path])
      emp.stdout.once('data', function (data) {
        debug(data.toString())
        env(ENV_FILE)
        debug('EMPIRICAL_DIR:', process.env.EMPIRICAL_DIR)
        getContainer('empiricalci/emp:test', `node index.js run --save empiricalci/mnist-sample mnist ${code_path}`, function (info) {
          container = info
        })
      })
      emp.on('close', function (code) {
        if (code) return done(new Error('Failed'))
        done()
      })
    })
    it('mounts code directory as read-only', function () {
      testMount(container, code_path, 'ro')
    })
  })
  describe('emp run --version <SHA> --save <owner/project> <protocol>', function () {
    var container
    const sha = '27e12070ca9618e1a66884995b6c872e2a15d886'
    it('runs and exits successfully', function (done) {
      this.timeout(60000)
      const emp = spawn('./bin/run.sh', ['run', '-v', sha, '-s', 'empiricalci/mnist-sample', 'mnist'])
      emp.stdout.once('data', function (data) {
        debug(data.toString())
        env(ENV_FILE)
        debug('EMPIRICAL_DIR:', process.env.EMPIRICAL_DIR)
        getContainer('empiricalci/emp:test', `node index.js run -v ${sha} -s empiricalci/mnist-sample mnist`, function (info) {
          container = info
        })
      })
      emp.on('close', function (code) {
        if (code) return done(new Error('Failed'))
        done()
      })
    })
    it('shouldn\'t mount code directory', function () {
      var vol = container.Mounts.find(function (volume) {
        return (volume.Source === 'mnist')
      })
      assert(!vol)
    })
  })

  describe('emp replicate <experimentId> </code/path/>', function () {
    var container
    const somePath = '/tmp/what'
    it('runs and exits successfully', function (done) {
      this.timeout(60000)
      const emp = spawn('./bin/run.sh', ['replicate', 'empiricalci/mnist-sample/mnist/mnistExperiment', somePath])
      emp.stdout.once('data', function (data) {
        debug(data.toString())
        env(ENV_FILE)
        debug('EMPIRICAL_DIR:', process.env.EMPIRICAL_DIR)
        getContainer('empiricalci/emp:test', `node index.js replicate empiricalci/mnist-sample/mnist/mnistExperiment ${somePath}`, function (info) {
          container = info
        })
      })
      emp.on('close', function (code) {
        if (code) return done(new Error('Failed'))
        done()
      })
    })
    it('should mount the given path', function () {
      testMount(container, somePath)
    })
  })
  describe('emp replicate <experimentId>', function () {
    var container
    const mountPath = path.join(process.cwd(), 'mnist')
    it('runs and exits successfully', function (done) {
      this.timeout(60000)
      const emp = spawn('./bin/run.sh', ['replicate', 'empiricalci/mnist-sample/mnist/mnistExperiment'])
      emp.stdout.once('data', function (data) {
        debug(data.toString())
        env(ENV_FILE)
        debug('EMPIRICAL_DIR:', process.env.EMPIRICAL_DIR)
        getContainer('empiricalci/emp:test', `node index.js replicate empiricalci/mnist-sample/mnist/mnistExperiment ${mountPath}`, function (info) {
          container = info
        })
      })
      emp.on('close', function (code) {
        if (code) return done(new Error('Failed'))
        done()
      })
    })
    it('should mount the destination directory', function () {
      testMount(container, mountPath)
    })
  })

  const test_hash = '986915f2caa2c8f9538f0b77832adc8abf3357681d4de5ee93a202ebf19bd8b8'
  describe('data get URL', function () {
    this.timeout(20000)
    const test_url = 'https://raw.githubusercontent.com/empiricalci/fixtures/data.csv'
    var container
    it('runs and exits successfully', function (done) {
      const emp2 = spawn('./bin/run.sh', ['data', 'get', test_url])
      emp2.stdout.once('data', function (data) {
        env(ENV_FILE)
        getContainer('empiricalci/emp:test', `node index.js data get ${test_url}`, function (info) {
          container = info
        })
      })
      emp2.on('close', function (code) {
        if (code) return done(new Error('Failed'))
        done()
      })
    })
    it('downloads the data successfully', function () {
      assert(fs.lstatSync(`${process.env.EMPIRICAL_DIR}/data/${test_hash}`).isFile())
    })
    // Common tests
    it('mounts environment config file', function () {
      testMount(container, ENV_FILE)
    })
    it('mounts the docker socket', function () {
      testMount(container, '/var/run/docker.sock')
    })
    it('mounts the workspaces directory', function () {
      testMount(container, `${process.env.EMPIRICAL_DIR}/workspaces`)
    })
    it('mounts the data directory', function () {
      testMount(container, `${process.env.EMPIRICAL_DIR}/data`)
    })
    it('passes $HOME')
  })
  describe('data hash FILE', function () {
    this.timeout(20000)
    var test_file
    var container
    it('runs and exits successfully', function (done) {
      test_file = `${process.env.EMPIRICAL_DIR}/data/${test_hash}`
      const abs_path = path.resolve(process.cwd(), test_file)
      const emp3 = spawn('./bin/run.sh', ['data', 'hash', test_file])
      emp3.stdout.once('data', function (data) {
        assert(data.toString().indexOf(test_hash) > -1, 'hash was not logged')
        env(ENV_FILE)
        getContainer('empiricalci/emp:test', `node index.js data hash ${abs_path}`, function (info) {
          container = info
        })
      })
      emp3.on('close', function (code) {
        if (code) return done(new Error('Failed'))
        done()
      })
    })
    it('mounts the data file', function () {
      testMount(container, test_file)
    })
    // Common tests
    it('mounts environment config file', function () {
      testMount(container, ENV_FILE)
    })
    it('mounts the docker socket', function () {
      testMount(container, '/var/run/docker.sock')
    })
    it('mounts the workspaces directory', function () {
      testMount(container, `${process.env.EMPIRICAL_DIR}/workspaces`)
    })
    it('mounts the data directory', function () {
      testMount(container, `${process.env.EMPIRICAL_DIR}/data`)
    })
    it('passes $HOME')
  })
})

after(function (done) {
  setup.resetConfig(ENV_FILE, done)
})
