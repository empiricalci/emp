
const path = require('path')

function pathAdapter (fpath) {
  if (!/^win/.test(process.platform)) return fpath
  var root = path.parse(fpath).root
  return path.posix.resolve('/', fpath.replace(root, root.toLowerCase()).replace(':', '').replace(/\\/g, '/'))
}

module.exports = pathAdapter
