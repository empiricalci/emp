
var config = {}

config.workspaces = process.env.EMPIRICAL_WORKSPACES || '~/workspaces'
config.data_dir = process.env.EMPIRICAL_DATA || '~/data'
config.config_filename = 'empirical.yml'
// TODO: Read it from a config.json
config.git = {
  auth: {
    type: 'ssh',
    user: 'alantrrs',
    privateKey: '/home/ambidextrvs/.ssh/id_rsa',
    pubKey: '/home/ambidextrvs/.ssh/id_rsa.pub',
    passphrase: ''
  }
}

module.exports = config
