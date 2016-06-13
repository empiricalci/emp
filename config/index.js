
var atob = require('atob')

var config = {}

const ENV = process.env.EMPIRICAL_ENV

config.workspaces = '/empirical/workspaces'
config.data_dir = '/empirical/data'
config.config_filename = 'empirical.yml'
config.HOST_DIR = process.env.EMPIRICAL_DIR

config.amqp = {
  host: process.env.EMPIRICAL_AMQP_URL || 'amqp://empirical-queue',
  queue: ENV ? 'builds:' + ENV : 'builds:development'
}

config.pusher = {
  key: process.env.PUSHER_KEY || 'da0b1e408201a3bde70f',
  auth_endpoint: process.env.PUSHER_AUTH_ENDPOINT || 'http://localhost:5000/api/pusher/auth_ci'
}

config.client = {
  key: process.env.EMPIRICAL_API_KEY,
  secret: process.env.EMPIRICAL_API_SECRET,
  root: process.env.EMPIRICAL_API_URI || 'http://empiricalci.com'
}

config.registry = {}
if (process.env.DOCKER_AUTH) {
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
}

module.exports = config
