
var Pusher = require('pusher-js/node')
var config = require('./config')
var emp = require('./lib')
var debug = require('debug')('emp')

var auth = new Buffer(`${config.client.key}:${config.client.secret}`).toString('base64')
var headers = {
  'Authorization': 'Basic ' + auth
}

var pusher = new Pusher(config.pusher.key, {
  authEndpoint: config.pusher.auth_endpoint,
  auth: {
    headers: headers
  }
})

pusher.connection.bind('error', function (err) {
  console.log('Connection error:', err)
  process.exit(1)
})

const channel = `private-${config.client.key}@tasks`
var tasks_channel = pusher.subscribe(channel)

tasks_channel.bind('pusher:subscription_error', function (status) {
  if (status === 403) {
    console.log('There is already another worker connected with these credentials.')
    process.exit(1)
  }
})

// Queue
var queue = []
console.log('EMP is listening for tasks on channel:', channel)
tasks_channel.bind('new-task', function (task) {
  debug('Received task: %o', task)
  queue.push(task)
})

// Consume
function consume () {
  var task = queue.shift()
  if (task) {
    debug('Running task: %o', task)
    return emp.runTask(task).then(function () {
      console.log('SUCCESS')
      consume()
    }).catch(function (err) {
      console.log('ERROR: ', err)
      consume()
    })
  } else {
    setTimeout(consume, 1000)
  }
}

consume()
