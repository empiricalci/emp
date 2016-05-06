
var atob = require('atob')

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

// Decode auth
var auth = atob(process.env.DOCKER_AUTH)
var creds = auth.split(':')
if (creds.length === 2) {
  // auth looks like user:password
  config.registry = {
    username: creds[0],
    password: creds[1]
  }
} else {
  // auth looks like {username:user,password:password,email:user@email.com}
  config.registry = {
    username: process.env.DOCKER_USER,
    key: process.env.DOCKER_AUTH
  }
}

module.exports = config
