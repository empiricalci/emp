var zmq = require('zmq')
var socket = zmq.socket('sub')

var exec = require('child_process').exec

var SOCKET_PORT = process.env.SOCKET_PORT || 3001
socket.connect('tcp://127.0.0.1:' + SOCKET_PORT)

socket.subscribe('command')
console.log('Suscriber connected to port ' + SOCKET_PORT)

socket.on('message', function (topic, message) {
  console.log('received a message related to:', topic.toString('utf-8'), 'containing message:', message.toString('utf-8'))
  exec('docker run hello-world', function (err, stdout, stderr) {
    if (err) throw err
    console.log(stdout)
  })
})
