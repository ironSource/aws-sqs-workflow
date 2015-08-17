var _ = require('lodash');
var Promise = require('bluebird');
var util = require('util');
var log4js = require('log4js');
var Connection = require('./connection');

function Worker(configOrConnection, workerConfig) {
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
    }, {
        QueueUrl: 'http://localhost:4568/test'
    });

     worker.poll();
     **/

    var self = this;
    self.connection = Connection(configOrConnection);
    self.config = _.defaults(workerConfig, {
        MaxNumberOfMessages: 10, // how many messages do we wanna retrieve?
        VisibilityTimeout: 60, // seconds - how long we want a lock on this job
        WaitTimeSeconds: 20, // seconds - how long should we wait for a message?
        PollingInterval: 5 // seconds - how often we need to poll the MQ
    });

    self.logger = log4js.getLogger('worker');
    self.logger.setLevel('DEBUG');

    self.deleteMessage = function (message) {
        return self.connection.deleteMessageAsync({
            QueueUrl: self.config.QueueUrl,
            ReceiptHandle: message.ReceiptHandle
        });
    };

    self.recieveMessages = function () {
        return self.connection.receiveMessageAsync({
            QueueUrl: self.config.QueueUrl,
            MaxNumberOfMessages: self.config.MaxNumberOfMessages,
            VisibilityTimeout: self.config.VisibilityTimeout,
            WaitTimeSeconds: self.config.WaitTimeSeconds
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
                self.logger.error("Message processing failure: %s", e);
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


var worker = new Worker({
    endpoint: 'http://localhost:4568',
    apiVersion: '2012-11-05',
    accessKeyId: 'access key',
    secretAccessKey: 'secret access key',
    region: 'us-east-1'
}, {
    QueueUrl: 'http://localhost:4568/test'
});

worker.poll();