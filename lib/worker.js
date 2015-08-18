var _ = require('lodash');
var util = require('util');
var events = require("events");
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
    events.EventEmitter.call(self);
    self.dispatcher = undefined;
    self.queueUrl = undefined;
    self.connection = Connection(configOrConnection);
    self.event = event;
    self.config = _.defaults(options || {}, {
        LogLevel: 'DEBUG',      // ['TRACE'|'DEBUG'|'INFO'|'WARN'|'ERROR']
        MaxNumberOfMessages: 10, // how many messages do we wanna retrieve?
        VisibilityTimeout: 60, // seconds - how long we want a lock on this job
        WaitTimeSeconds: 20, // seconds - how long should we wait for a message?
        PollingInterval: 10 // seconds - how often we need to poll the MQ
    });

    self.logger = log4js.getLogger(util.format('Event Worker [%s]', self.event));
    self.logger.setLevel(self.config.LogLevel);

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
                    self.logger.error(
                        util.format("failed to determine queue for polling: %s", e)
                    );
                });
        } else {
            return Promise.resolve(self.queueUrl);
        }
    };

    self.deleteMessage = function (message) {
        self.logger.debug(util.format("Removing message Id %s from queue.", message.MessageId));
        return self.getQueueUrl()
            .then(function(queueUrl) {
                return self.connection.deleteMessageAsync({
                    QueueUrl: queueUrl,
                    ReceiptHandle: message.ReceiptHandle
                });
            })
            .catch(function(e) {
                self.emit('error', e);
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
                    _.each(data.Messages, function(message) {
                        self.emit('message', message);
                    });
                } else {
                    self.logger.debug("Queue is empty");
                }
                return Promise.resolve();
            })
            .catch(function(err) {
                self.logger.error("Worker failure: %s", err.toString());
            });
    };

    self.poll = function () {
        return setInterval(
            self.recieveMessages.bind(self),
            self.config.PollingInterval * 1000
        );
    };

    // first emitter will remove the message from the queue
    self._events['message'] = function(message) {
        self.logger.debug(util.format("Processing message %s: %s", message.MessageId, message.Body));
        self.deleteMessage(message);
    };

    // complete the execution flow of this worker
    self.complete = function(message) {
        self.emit('complete', message);
    };
}

util.inherits(Worker, events.EventEmitter);
module.exports = Worker;