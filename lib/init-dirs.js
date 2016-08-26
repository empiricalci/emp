
const mkdirMaybe = require('./mkdir-maybe')

module.exports = function () {
  return mkdirMaybe(process.env.DATA_PATH).then(function () {
    return mkdirMaybe(process.env.WORKSPACES_PATH)
  })
}
