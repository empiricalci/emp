
var config = {}

const ENV = process.env.EMPIRICAL_ENV

// TODO: Read from a config.json
config.workspaces = process.env.EMPIRICAL_WORKSPACES || '~/workspaces'
config.data_dir = process.env.EMPIRICAL_DATA || '~/data'
config.config_filename = 'empirical.yml'

config.amqp = {
  host: process.env.EMPIRICAL_AMQP_URL || 'amqp://empirical-queue',
  queue: ENV ? 'builds:' + ENV : 'builds:development'
}

config.client = {
  key: process.env.EMPIRICAL_API_KEY,
  secret: process.env.EMPIRICAL_API_SECRET,
  root: process.env.EMPIRICAL_API_URI || 'http://empiricalci.com'
}

config.registry = {
  user: process.env.DOCKER_USER,
  auth: process.env.DOCKER_AUTH
}

module.exports = config
