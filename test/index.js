/* eslint-env mocha */

var assert = require('assert')
var fs = require('fs')
var path = require('path')
var logger = require('../lib/logger')
var setup = require('./setup')
var rm = require('rimraf')

logger.writeToConsole(false)

const ENV_FILE = path.join(process.env.HOME, '/.emp/emp.env')
const code_dir = '/tmp/mnist-test-project'
const tmpPath = '/tmp/some_dir'
const tmpPath2 = path.join(process.cwd(), 'mnist')

before(function (done) {
  process.env.EMPIRICAL_HOST = 'http://localhost:1337'
  rm(tmpPath, function () {
    rm(tmpPath2, function () {
      rm(code_dir, function () {
        setup.backupConfig(ENV_FILE, done)
      })
    })
  })
})

const newDir = '/tmp/empirical'
describe('config', function () {
  var config = require('../lib/config')
  it('.load() should create a default config file if there is none', function (done) {
    config.load().then(function () {
      assert(fs.lstatSync(ENV_FILE).isFile())
      assert.equal(process.env.EMPIRICAL_DIR, `${process.env.HOME}/empirical`)
      assert.equal(process.env.DATA_PATH, `${process.env.HOME}/empirical/data`)
      assert.equal(process.env.WORKSPACES_PATH, `${process.env.HOME}/empirical/workspaces`)
      done()
    }).catch(done)
  })
  it('.update() should save updated variables', function (done) {
    config.update({dir: newDir})
    fs.readFile(ENV_FILE, 'utf8', function (err, content) {
      assert.ifError(err)
      assert(content.indexOf(`EMPIRICAL_DIR=\"${newDir}\"`) > -1, 'Variable not saved')
      done()
    })
  })
  it('.updateDir() should fail with relative dirs', function (done) {
    config.updateDir('node_modules/').then(function () {
      done(new Error('Should\'t upadte relative paths'))
    }).catch(function (err) {
      assert.equal(err.message, 'Relative paths not allowed')
      done()
    })
  })
  it('.load() should load the env variables if the file exists', function (done) {
    config.load().then(function () {
      assert.equal(process.env.EMPIRICAL_DIR, newDir)
      assert.equal(process.env.DATA_PATH, `${newDir}/data`)
      assert.equal(process.env.WORKSPACES_PATH, `${newDir}/workspaces`)
      done()
    }).catch(done)
  })
})

describe('initDirs()', function () {
  it('should create data and workspace directories', function (done) {
    var initDirs = require('../lib/init-dirs')
    initDirs().then(function () {
      assert(fs.lstatSync(`${newDir}/data`).isDirectory())
      assert(fs.lstatSync(`${newDir}/workspaces`).isDirectory())
      done()
    }).catch(done)
  })
})

describe('auth', function () {
  var auth = require('../lib/auth')
  before(function (done) {
    this.timeout(20000)
    require('./wait-for-it')('http://localhost:1337', done)
  })
  it('.login() should not save credentials when invalid', function (done) {
    auth.login({user: 'empirical-bot', password: 'wrongPassword'})
    .then(function () {
      done(new Error('Login error not caught'))
    }).catch(function (err) {
      assert.equal(err.message, 'Login failed. Wrong credentials.')
      done()
    })
  })

  it('.login() should save credentials when valid', function (done) {
    auth.login({user: 'empirical-bot', password: 'password'})
    .then(function () {
      var creds = new Buffer(process.env.EMPIRICAL_AUTH, 'base64').toString().split(':')
      assert.equal(creds[0], 'empirical-bot')
      assert.equal(creds[1], 'password')
      fs.readFile(ENV_FILE, 'utf8', function (err, content) {
        assert.ifError(err)
        assert(content.indexOf(`EMPIRICAL_AUTH=\"${process.env.EMPIRICAL_AUTH}\"`) > -1, 'Variable not saved')
        done()
      })
    }).catch(done)
  })

  it('.logout() should clear credentials', function (done) {
    auth.logout()
    fs.readFile(ENV_FILE, 'utf8', function (err, content) {
      assert.ifError(err)
      assert.equal(process.env.EMPIRICAL_AUTH, 'None')
      assert(content.indexOf(`EMPIRICAL_AUTH=\"None\"`) > -1, 'Variable not saved')
      done()
    })
  })
})

const sha = 'd539a5cc8fd0947470ccf3752a9dbd0f0d6e4e7a'
describe('gitClone', function () {
  var gitClone = require('../lib/git-clone')
  it('should clone a public repo without a token', function (done) {
    this.timeout(300000)
    var repo = 'https://github.com/empiricalci/mnist-sample.git'
    gitClone(repo, code_dir, null, sha).then(function (repo) {
      assert(fs.lstatSync(code_dir).isDirectory())
      done()
    }).catch(done)
  })
})

describe('gitHeadCommit', function () {
  var gitHeadCommit = require('../lib/git-head')
  it('should return the head sha', function (done) {
    gitHeadCommit(code_dir).then(function (head_sha) {
      assert.equal(head_sha, sha)
      done()
    }).catch(done)
  })
})

describe('readProtocol', function () {
  const readProtocol = require('../lib/read-protocol')
  it('should return a valid protocol', function () {
    var protocol = readProtocol('./node_modules/fixtures/standalone_project', 'hello-world')
    assert.equal(protocol.type, 'standalone')
    assert(protocol.dataset.resources['answers.csv'])
    assert(protocol.environment.tag)
  })
  it('should return null if the protocol doesn\'t exits in the empirical.yml', function () {
    var protocol = readProtocol('./node_modules/fixtures/standalone_project', 'some-protocol')
    assert(!protocol)
  })
})

describe('data', function () {
  it('.install() should install from json file path')
  it('.install() should install from object')
})

describe('buildImage', function () {
  it('should reject if there is an error', function (done) {
    this.timeout(60000)
    const buildImage = require('../lib/build-image')
    buildImage({
      build: '.',
      dockerfile: 'bad_dockerfile'
    }, './test', logger.write).then(function () {
      done(new Error('Build error not caught'))
    }).catch(function (err) {
      assert(err)
      done()
    }).catch(done)
  })
})

describe('runExperiment', function () {
  it('should run a sandalone experiment', function (done) {
    this.timeout(300000)
    const runExperiment = require('../lib/run-experiment')
    runExperiment({
      id: 'some_id',
      type: 'standalone',
      environment: {
        tag: 'empiricalci/test_standalone'
      }
    }).then(function () {
      done()
    }).catch(done)
  })
  it('should fail if the experiment fails')
})

describe('run()', function () {
  const run = require('../lib/run')
  it('should run an experiment', function (done) {
    this.timeout(60000)
    run({
      protocol: 'hello-world',
      code_path: 'node_modules/fixtures/standalone_project'
    }, logger)
    .then(function () {
      // TODO: Assert stuff
      done()
    })
    .catch(done)
  })
  it('should fail if no code path is given', function (done) {
    run({
      protocol: 'hello-world'
    }, logger)
    .then(function () {
      done(new Error('Didn\'t throw error without a code path'))
    })
    .catch(function (err) {
      assert.equal(err.message, 'Error: emp run requires a code path')
      done()
    })
  })
  it('should fail if the experiment-name is not found', function (done) {
    run({
      protocol: 'something',
      code_path: 'node_modules/fixtures/standalone_project'
    }, logger)
    .then(function () {
      done(new Error('Protocol not found error wasn\'t caught'))
    })
    .catch(function (err) {
      assert.equal(err.message, `Protocol "something" not found`)
      done()
    }).catch(done)
  })
  it('should save an experiment', function (done) {
    this.timeout(60000)
    run({
      protocol: 'mnist',
      code_path: code_dir,
      project: 'empiricalci/mnist-sample'
    }, logger)
    .then(function () {
      // TODO: Assert
      done()
    })
    .catch(done)
  })
  it('should save an experiment for a specific version', function (done) {
    this.timeout(60000)
    run({
      protocol: 'mnist',
      head_sha: 'd539a5cc8fd0947470ccf3752a9dbd0f0d6e4e7a',
      project: 'empiricalci/mnist-sample'
    }, logger)
    .then(function () {
      // TODO: Assert
      done()
    })
    .catch(done)
  })
})

describe('replicate()', function () {
  const replicate = require('../lib/replicate')
  it('should download and run an experiment and save the code on the given path', function (done) {
    this.timeout(60000)
    replicate('empiricalci/mnist-sample/mnist/mnistExperiment', tmpPath, logger).then(function () {
      assert(fs.lstatSync(tmpPath).isDirectory())
      // TODO: Assertions
      done()
    }).catch(done)
  })
  it('should save code on current directory if no code path is given', function (done) {
    this.timeout(60000)
    replicate('empiricalci/mnist-sample/mnist/mnistExperiment', undefined, logger).then(function () {
      assert(fs.lstatSync(tmpPath2).isDirectory())
      // TODO: Assertions
      done()
    }).catch(done)
  })
})

after(function (done) {
  rm(tmpPath, function () {
    rm(tmpPath2, function () {
      setup.resetConfig(ENV_FILE, done)
    })
  })
})
