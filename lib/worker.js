
var amqp = require('amqplib')
var config = require('../config')
var emp = require('.')

exports.consumeTasks = function () {
  return amqp.connect(config.amqp.host).then(function (conn) {
    console.log('Empirical client connected to', config.amqp.host)
    process.once('SIGINT', function () { conn.close() })
    return conn.createChannel().then(function (ch) {
      ch.assertQueue(config.amqp.queue, {durable: false})
      ch.prefetch(1)
      console.log('EMP Waiting to receive tasks on', config.amqp.queue)
      ch.consume(config.amqp.queue, function (msg) {
        if (!msg) return
        var task = JSON.parse(msg.content.toString())
        emp.runTask(task).then(function (res) {
          console.log('Acknowledge message')
          ch.ack(msg)
        }).catch(emp.handleError)
      })
    })
  })
}

exports.send = function () {

}
