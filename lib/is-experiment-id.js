
module.exports = function (string) {
  return /^[a-zA-Z0-9-_]+\/[a-zA-Z0-9-_]+\/x\/[a-zA-Z0-9-_]+$/.test(string)
}
