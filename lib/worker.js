var _ = require('lodash');
var util = require('util');
var log4js = require('log4js');
var Promise = require('bluebird');

var Dispatcher = require('./Dispatcher');
var Connection = require('./connection');

function Worker(configOrConnection, event, options) {
    /**
     * SQS Worker Implementation.
     * @param awsConnection:
     * @param workerConfig:
     * @constructor
     *
     * example
     * -----------------
     var worker = new Worker({
        endpoint: 'http://localhost:4568',
        apiVersion: '2012-11-05',
        accessKeyId: 'access key',
        secretAccessKey: 'secret access key',
        region: 'us-east-1'
    }, 'e1', {});

     worker.poll();
     **/

    var self = this;
    self.dispatcher = undefined;
    self.queueUrl = undefined;
    self.connection = Connection(configOrConnection);
    self.event = event;
    self.config = _.defaults(options || {}, {
        MaxNumberOfMessages: 10, // how many messages do we wanna retrieve?
        VisibilityTimeout: 60, // seconds - how long we want a lock on this job
        WaitTimeSeconds: 20, // seconds - how long should we wait for a message?
        PollingInterval: 5 // seconds - how often we need to poll the MQ
    });

    self.logger = log4js.getLogger(util.format('Event Worker [%s]', self.event));
    self.logger.setLevel('DEBUG');

    self.getDispatcher = function() {
        if (!self.dispatcher) self.dispatcher = new Dispatcher(self.connection);
        return self.dispatcher;
    };

    self.getQueueUrl = function() {
        if (!self.queueUrl) {
            return self.connection.getQueue(self.event)
                .then(function(queue) {
                    self.queueUrl = queue.QueueUrl;
                    return self.queueUrl;
                })
                .catch(function(e) {
                    self.logger.error("failed to determine queue for polling: %s", e);
                });
        } else {
            return self.queueUrl;
        }
    };

    self.deleteMessage = function (message) {
        return self.connection.deleteMessageAsync({
            QueueUrl: self.config.QueueUrl,
            ReceiptHandle: message.ReceiptHandle
        });
    };

    self.recieveMessages = function () {
        return self.getQueueUrl()
            .then(function(queueUrl) {
                return self.connection.receiveMessageAsync({
                    QueueUrl: queueUrl,
                    MaxNumberOfMessages: self.config.MaxNumberOfMessages,
                    VisibilityTimeout: self.config.VisibilityTimeout,
                    WaitTimeSeconds: self.config.WaitTimeSeconds
                });
            })
            .then(function(data) {
                if (data && data.Messages) {
                    return Promise.each(
                        data.Messages, self.processMessage.bind(self)
                    );
                } else {
                    self.logger.debug("Queue is empty");
                    return Promise.resolve();
                }
            })
            .catch(function(e) {
                self.logger.error("Message processing failure: %s", e.toString());
            });
    };

    self.poll = function () {
        return setInterval(
            self.recieveMessages.bind(self),
            self.config.PollingInterval * 1000
        );
    };
}

Worker.prototype.processMessage = function (message) {
    this.logger.debug(util.format("Starting to process message %s: %s", message.MessageId, message.Body));
    return this.deleteMessage(message);
};

module.exports = Worker;
