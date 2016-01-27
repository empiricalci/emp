
var amqp = require('amqplib')
var config = require('../config')
var emp = require('.')

exports.runTask = function (task) {
  if (!task.ssh_url) return Promise.reject('Git repository URL not provided')
  return emp.createSessionDirs(task._id).then(function (dirs) {
    return emp.cloneRepository(task.ssh_url, task.head_sha, dirs.code).then(function () {
      return emp.buildImages(dirs.code)
    }).then(function (experiments) {
      return emp.runExperiments(experiments)
    })
  })
}

exports.consumeTasks = function () {
  return amqp.connect(config.amqp.host).then(function (conn) {
    return conn.createChannel().then(function (ch) {
      ch.assertQueue(config.amqp.queue, {durable: false})
      console.log('EMP Waiting to receive tasks..')
      ch.consume(config.amqp.queue, function (msg) {
        if (!msg) return
        var task = JSON.parse(msg.content.toString())
        exports.runTask(task).then(function (res) {
          console.log('Acknowledge message')
          ch.ack(msg)
        }).catch(emp.handleError)
      })
    })
  })
}

exports.send = function () {

}
