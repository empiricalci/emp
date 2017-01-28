
// Just check if it's a URL for now

module.exports = function (string) {
  var matcher = /^(?:\w+:)?\/\/([^\s\.]+\.\S{2}|localhost[\:?\d]*)\S*$/
  return matcher.test(string)
}

