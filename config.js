

var config = {}

config.workspaces = process.env.EMPIRICAL_WORKSPACES || '~/workspaces'
config.data_dir = process.env.EMPIRICAL_DATA || '~/data'

module.exports = config
