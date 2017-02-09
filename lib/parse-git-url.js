
module.exports = function (url) {
  var arr = url.split('#')
  var data = {repo: arr[0]}
  if (arr.length === 2) data.commit = arr[1]
  return data
}
