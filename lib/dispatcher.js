var Promise = require('bluebird');
var log4js = require('log4js');
var Sqs = require('./sqs');
var util = require('util');

function Dispatcher(configOrConnection) {
    var self = this;
    self.logger = log4js.getLogger('dispatcher');
    self.logger.setLevel('DEBUG');
    self.connection = Sqs.getConnection(configOrConnection);

    self.getQueue = function (queue) {
        var params = {
            QueueName: queue
        };
        return self.connection.getQueueUrlAsync(params)
            .catch(function (err) {
                if (err.code != 'NonExistentQueue') {
                    return Promise.reject(err);
                } else {
                    return self.connection.createQueueAsync(params);
                }
            })
    };

    self.dispatch = function (queue, message) {
        return self.getQueue(queue)
            .then(function (queue) {
                return self.connection.sendMessageAsync({
                    MessageBody: JSON.stringify(message),
                    QueueUrl: queue.QueueUrl.replace('0.0.0.0', 'localhost')
                });
            })
            .then(function(result) {
                self.logger.debug(util.format("dispatched new message: %s", result.MessageId));
            })
            .catch(function (e) {
                self.logger.error("Dispatch failure: %s", e.toString());
            });
    };
}

module.exports = Dispatcher;