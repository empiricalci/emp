var config = require('../config')
var path = require('path')
var shortid = require('shortid')
var YAML = require('yamljs')
var docker = require('dockerise')
var git = require('./git')
var client = require('./client')
var cache = require('dataset-cache')
var fs = require('fs')
var debug = require('debug')('emp')
var prettyjson = require('prettyjson')

exports.runTask = function (task, logHandler) {
  debug('Build %s is now running', task.full_name)
  return client.updateExperiment(task.full_name, {
    status: 'running'
  }).then(function (task) {
    debug('task: %o', task)
    return client.getKeys(task.repo.full_name).then(function (keys) {
      debug('Cloning from %s', task.repo.ssh_url)
      if (task.push.head_sha) logHandler(`Cloning from ${task.push.head_sha}`)
      return getCodeDir(task.repo.ssh_url, task.push.head_sha, keys)
    }).then(function (codeDir) {
      var experiment = readExperimentConfig(codeDir, task)
      return buildImage(experiment.environment, codeDir, logHandler).then(function () {
        // Push built Image
        if (experiment.type !== 'evaluator') return
        return docker.push(experiment.environment.tag, logHandler).then(function () {
          // Save to database
          return client.updateExperiment(task.full_name, {
            image: experiment.environment.tag
          })
        })
      }).then(function () {
        // Get dataset
        return getDataset(codeDir, experiment.dataset)
      }).then(function (data) {
        if (!data) {
          logHandler('No dataset provided')
        } else {
          logHandler(prettyjson.render(data))
        }
        return runExperiment(experiment, logHandler)
      }).then(function () {
        // Post Results
        return getResults(experiment)
        .then(function (overall) {
          if (overall) {
            logHandler(prettyjson.render({overall: overall}))
            return client.updateExperiment(task.full_name, {
              overall: overall
            })
          } else {
            logHandler('No overall results provided')
          }
        })
      })
    })
  }).then(function () {
    debug(`Build ${task.full_name} succeeded`)
    logHandler(`Build ${task.full_name} succeeded`)
    return client.updateExperiment(task.full_name, {
      status: 'success'
    })
  }, function (err) {
    debug('ERROR: %o', err)
    debug(`Build ${task.full_name} failed with error: ${err.message}`)
    logHandler(`Build ${task.full_name} failed with error: ${err.message}`)
    return client.updateExperiment(task.full_name, {
      status: 'failed',
      error: err
    })
  })
}

function getCodeDir (repo, sha, keys) {
  if (!repo) return Promise.reject('Git repository URL not provided')
  // Save keys to disk as a workaround
  // FIXME: Use the from memory. Don't save to disk
  // After: https://github.com/nodegit/nodegit/pull/949
  const dir = '/tmp/'
  const rnd = shortid.generate()
  const key_files = {
    public_key: path.join(dir, `${rnd}-public_key`),
    private_key: path.join(dir, `${rnd}-private_key`)
  }
  fs.writeFileSync(key_files.public_key, keys.public_key + '\n', 'utf8') // TODO: WHYYY??
  fs.writeFileSync(key_files.private_key, keys.private_key, 'utf8')
  const codeDir = path.join(dir, rnd)
  return git.cloneRepository(repo, sha, key_files, codeDir)
  // Validate sha
  .then(function (repo) {
    return repo.getHeadCommit().then(function (commit) {
      if (sha !== commit.sha()) return Promise.reject('Failed getting code')
    }).then(function () {
      return codeDir
    })
  })
  // TODO: Remove the keys
}

function getDataset (dir, dataset) {
  if (dataset) {
    var data = require(path.join(dir, dataset))
    debug('EXTRACT DATASET: %s/%s -> %s', dir, dataset, config.data_dir)
    return cache.install(data, config.data_dir)
  } else {
    return Promise.resolve(null)
  }
}

function readExperimentConfig (code_dir, task) {
  var yml = YAML.load(path.resolve(code_dir, config.config_filename))
  var exp_config = yml.experiments[task.name]
  if (!exp_config) throw new Error('Experiment name not found on empirical.yml:', task.project_name)
  if (!task._id) { // if being used as CLI
    exp_config._id = `${task.name}-${shortid.generate()}`
    // Default experiment type is standalone
    if (!exp_config.type) exp_config.type = 'standalone'
    exp_config.environment.tag = `${task.name}`
    return exp_config
  }
  if (exp_config.type && exp_config.type !== task.type) throw new Error('Interface type mismatch')
  var experiment = task
  experiment.environment = exp_config.environment
  experiment.environment.tag = `${experiment.name}-${experiment._id}`
  experiment.dataset = exp_config.dataset
  return experiment
}

function buildImage (image, code_dir, onData) {
  return docker.build(code_dir, image).then(function (stream) {
    return new Promise(function (resolve, reject) {
      if (!stream) reject(new Error('buildImage failed: null stream'))
      stream.on('end', function () {
        resolve()
      }).on('error', reject)
      if (typeof onData === 'function') {
        stream.on('data', function (data) {
          // TODO: Parse json to render nice logs
          var dataStr = data.toString()
          onData(dataStr)
          var dataObj = JSON.parse(dataStr)
          if (dataObj.error) reject(new Error(`buildImage failed: ${dataObj.error}`))
        })
      }
    })
  })
}

function runExperiment (experiment, logHandler) {
  debug('runExperiment: %o', experiment)
  switch (experiment.type) {
    case 'evaluator':
      // Evaluator doesn't run experiments
      return Promise.resolve()
    case 'solver':
      return runSolver(experiment, logHandler)
    case 'standalone':
      return runStandalone(experiment, logHandler)
    default:
      return Promise.reject('Unknown experiment type:', experiment.type)
  }
}

function runStandalone (experiment, logHandler) {
  var standalone = {
    image: experiment.environment.tag,
    env: [
      `EXPERIMENT_ID=${experiment._id}`,
      `EMPIRICAL_API_URL=${config.client.root}/api/x`
    ],
    binds: [
      `${config.HOST_DIR}/data:/data:ro`,
      `${config.HOST_DIR}/workspaces/${experiment._id}:/workspace`
    ]
  }
  return docker.run(standalone, logHandler).then(function (res) {
    return docker.remove(res.container)
  })
}

function runSolver (experiment, logHandler) {
  if (!experiment.evaluator) return Promise.reject('No evaluator defined')
  var solver = {
    image: experiment.environment.tag
  }
  return client.getBuild(experiment.evaluator).then(function (res) {
    if (!res.image) return Promise.reject('Evaluator does\'t specify an image')
    var evaluator = {
      image: res.image,
      env: [
        `EXPERIMENT_ID=${experiment._id}`,
        `EMPIRICAL_AUTH=${client.auth}`,
        `EMPIRICAL_API_URL=${config.client.root}/api/x`
      ]
    }
    logHandler('RUN SOLVER WITH EVALUATOR', solver.image, evaluator.image)
    // Pull and Run
    return docker.pull(evaluator.image, undefined, logHandler).then(function () {
      return docker.runLinked(solver, evaluator)
    }).then(function (containers) {
      console.log('Containers:', containers)
      // Cleanup
      return docker.remove(containers.client).then(function () {
        return docker.stop(containers.server).then(docker.remove)
      })
    })
  })
}

function getResults (experiment) {
  const results_file = path.join(config.workspaces, experiment._id, 'overall.json')
  return new Promise(function (resolve, reject) {
    try {
      var results = JSON.parse(fs.readFileSync(results_file, 'utf8'))
      resolve(results)
    } catch (e) {
      if (e.code === 'ENOENT') return resolve(null)
      reject(e)
    }
  })
}

exports.handleError = function (err) {
  // TODO: if on Client mode send message
  console.error(err)
}

// Export relevant functions
exports.client = client
exports.getCodeDir = getCodeDir
exports.readExperimentConfig = readExperimentConfig
exports.buildImage = buildImage
exports.getDataset = getDataset
exports.runExperiment = runExperiment
exports.getResults = getResults
