
var config = {}

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
  queue: process.env.EMPIRICAL_ENV ? 'builds:' + process.env.EMPIRICAL_ENV : 'builds:development'
}

module.exports = config
