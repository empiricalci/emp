
var amqp = require('amqplib')
var config = require('../config')
var emp = require('.')

exports.runTask = function (task) {
  if (!task.ssh_url) return Promise.reject('Git repository URL not provided')
  return emp.createSessionDirs(task._id).then(function (dirs) {
    return emp.cloneRepository(task.ssh_url, dirs.code).then(function () {
      return emp.buildImage(dirs.code, config.config_filename)
    }).then(function () {
      console.log('Runnig experiments:')
      return emp.runExperiments(dirs.code, config.config_filename)
    })
  })
}

exports.consumeTasks = function () {
  return amqp.connect(config.host).then(function (conn) {
    return conn.createChannel().then(function (ch) {
      ch.assertQueue(config.amqp.queue, {durable: false})
      console.log('EMP Waiting to receive tasks..')
      ch.consume(config.amqp.queue, function (msg) {
        if (!msg) return
        var task = JSON.parse(msg.content.toString())
        exports.runTask(task).then(function () {
          console.log('Acknowledge message')
          ch.ack(msg)
        }).catch(emp.handleError)
      })
    })
  })
}

exports.send = function () {

}
