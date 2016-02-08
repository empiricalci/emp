
var config = {}

const ENV = process.env.EMPIRICAL_ENV

config.workspaces = process.env.EMPIRICAL_WORKSPACES || '~/workspaces'
config.data_dir = process.env.EMPIRICAL_DATA || '~/data'
config.config_filename = 'empirical.yml'
// TODO: Read it from a config.json
// TODO: Mount keys into docker container
config.git = {
  auth: {
    type: 'ssh',
    user: 'alantrrs',
    privateKey: '/home/ambidextrvs/.ssh/id_rsa',
    pubKey: '/home/ambidextrvs/.ssh/id_rsa.pub',
    passphrase: ''
  }
}

config.amqp = {
  host: process.env.EMPIRICAL_AMQP_URL || 'amqp://empirical-queue',
  queue: ENV ? 'builds:' + ENV : 'builds:development'
}

const endpoints = {
  development: 'http://empiricaldev.localtunnel.me',
  staging: 'http://scihub-qa.herokuapp.com',
  production: 'http://scihub.herokuapp.com'
}

// TODO: Add auth via key + secret
config.client = {
  root: ENV ? endpoints[ENV] : endpoints.development
}

module.exports = config
