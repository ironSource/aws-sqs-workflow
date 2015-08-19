var _ = require('lodash');
var util = require('util');
var url = require('url');
var events = require("events");
var log4js = require('log4js');
var Promise = require('bluebird');
var Id = require('shortid');

var Dispatcher = require('./Dispatcher');
var Connection = require('./connection');

function Worker(configOrConnection, queueUrl, options) {
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
    self.queueUrl = queueUrl;
    self.name = util.format("%s-%s", url.parse(self.queueUrl).pathname.slice(1), Id.generate());
    self.connection = Connection(configOrConnection);
    self.config = _.defaults(options || {}, {
        LogLevel: 'DEBUG',      // ['TRACE'|'DEBUG'|'INFO'|'WARN'|'ERROR']
        MaxNumberOfMessages: 10, // how many messages do we wanna retrieve?
        VisibilityTimeout: 60, // seconds - how long we want a lock on this job
        WaitTimeSeconds: 20, // seconds - how long should we wait for a message?
        PollingInterval: 10 // seconds - how often we need to poll the MQ
    });
    self.logger = log4js.getLogger(util.format('Queue Worker [%s]', self.name));
    self.logger.setLevel(self.config.LogLevel);

    self.getDispatcher = function() {
        if (!self.dispatcher) self.dispatcher = new Dispatcher(self.connection);
        return self.dispatcher;
    };

    self.deleteMessage = function (message) {
        self.logger.debug(util.format("Removing message Id %s from queue.", message.MessageId));
        return self.connection.deleteMessageAsync({
            QueueUrl: self.queueUrl,
            ReceiptHandle: message.ReceiptHandle
        });
    };

    self.receiveMessages = function () {
        return self.connection.receiveMessageAsync({
            QueueUrl: queueUrl,
            MaxNumberOfMessages: self.config.MaxNumberOfMessages,
            VisibilityTimeout: self.config.VisibilityTimeout,
            WaitTimeSeconds: self.config.WaitTimeSeconds
        })
            .then(function(data) {
                if (data && data.Messages) {
                    _.each(data.Messages, function(message) {
                        self.emit('message', message);
                    });
                } else {
                    self.logger.trace("Queue is empty");
                }
                return Promise.resolve();
            })
            .catch(function(err) {
                self.logger.error("Worker failure: %s", err.toString());
            });
    };

    self.poll = function () {
        self.logger.debug("Polling queue every %d seconds", self.config.PollingInterval);
        return setInterval(
            self.receiveMessages.bind(self),
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