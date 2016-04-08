
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

const endpoints = {
  test: process.env.EMPIRICAL_API_URI,
  development: 'http://empiricaldev.localtunnel.me',
  staging: 'http://qa.empiricalci.com',
  production: 'http://empiricalci.com'
}

// TODO: Add auth via key + secret
config.client = {
  key: process.env.EMPIRICAL_API_KEY,
  secret: process.env.EMPIRICAL_API_SECRET,
  root: ENV ? endpoints[ENV] : endpoints.development
}

config.registry = {
  user: 'empiricaladmin',
  auth: process.env.DOCKER_AUTH
}

module.exports = config
