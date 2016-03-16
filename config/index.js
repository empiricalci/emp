
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
  development: 'http://empiricaldev.localtunnel.me',
  staging: 'http://qa.empiricalci.com',
  production: 'http://empiricalci.com'
}

// TODO: Add auth via key + secret
config.client = {
  root: ENV ? endpoints[ENV] : endpoints.development
}

module.exports = config
