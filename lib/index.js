var config = require('../config')
var path = require('path')
var shortid = require('shortid')
var YAML = require('yamljs')
var docker = require('dockerise')
var git = require('./git')
var client = require('./client')
var cache = require('dataset-cache')
var fs = require('fs')

exports.runTask = function (task) {
  log('Build', task._id, 'is now running')
  return client.updateBuild({
    _id: task._id,
    status: 'running'
  }).then(function (task) {
    return client.getKeys(task.project.full_name).then(function (keys) {
      log('Cloning from', task.ssh_url)
      if (task.head_sha) log('commit', task.head_sha)
      return getCodeDir(task.ssh_url, task.head_sha, keys)
    }).then(function (codeDir) {
      log('BUILD FULL NAME:', task.full_name)
      var experiment = readExperimentConfig(codeDir, task)
      return buildImage(experiment.environment, codeDir).then(function () {
        // Push built Image
        if (experiment.type !== 'evaluator') return
        return docker.push(experiment.environment.tag, onPushProgress).then(function () {
          // Save to database
          return client.updateBuild({
            _id: experiment._id,
            image: experiment.environment.tag
          })
        })
      }).then(function () {
        // Get dataset
        return getDataset(experiment.dataset)
      }).then(function (data) {
        if (!data) console.log('No dataset provided')
        return runExperiment(experiment)
      })
    })
  }).then(function () {
    log('Build', task._id, 'succeeded')
    return client.updateBuild({
      _id: task._id,
      status: 'success'
    })
  }, function (err) {
    log('Build', task._id, 'failed with err:', err)
    return client.updateBuild({
      _id: task._id,
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

function getDataset (dataset) {
  if (dataset) {
    return cache.install(dataset, config.data_dir)
  } else {
    return null
  }
}

function readExperimentConfig (code_dir, task) {
  var yml = YAML.load(path.resolve(code_dir, config.config_filename))
  var exp_config = yml.experiments[task.project_name]
  if (!exp_config) throw new Error('Experiment name not found on empirical.yml:', task.project_name)
  if (!task._id) { // if being used as CLI
    exp_config._id = shortid.generate()
    exp_config.environment.tag = `${task.project_name}`
    return exp_config
  }
  if (exp_config.type !== task.project_interface) throw new Error('Interface type mismatch')
  var experiment = task
  experiment.type = experiment.project_interface // TODO: This should probably be renamed
  experiment.environment = exp_config.environment
  experiment.environment.tag = `${config.registry.username}/${experiment._id}`
  experiment.dataset = exp_config.dataset
  return experiment
}

function buildImage (image, code_dir) {
  log('BUILDING ENVIRONMENT:', image)
  return docker.build(code_dir, image)
}

function runExperiment (experiment) {
  switch (experiment.type) {
    case 'evaluator':
      // Evaluator doesn't run experiments
      return Promise.resolve()
    case 'solver':
      return runSolver(experiment)
    case 'standalone':
      return runStandalone(experiment)
    default:
      return Promise.reject('Unknown experiment type:', experiment.type)
  }
}

function runStandalone (experiment) {
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
  log('RUN STANDALONE:', standalone)
  return docker.run(standalone).then(function (res) {
    return docker.remove(res.container)
  })
}

function runSolver (experiment) {
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
    log('RUN SOLVER WITH EVALUATOR', solver.image, evaluator.image)
    // Pull and Run
    return docker.pull(evaluator.image, undefined, log).then(function () {
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

function onPushProgress (data) {
  console.log(data)
}

function log (data) {
  if (typeof data !== String) data = [].slice.call(arguments).join(' ')
  if (process.env.EMPIRICAL_ENV !== 'test' || process.env.DEBUG) console.log(data)
}

exports.onStdOut = function (log) {
  process.stdout.write(log.toString())
// TODO: if on Client mode send message
}

exports.onStdErr = function (err) {
  process.stderr.write(err.toString())
// TODO: if on Client mode send message
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
exports.log = log
