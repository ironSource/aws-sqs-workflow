var _ = require('lodash');
var log4js = require('log4js');
var util = require('util');
var Promise = require('bluebird');
var Connection = require('./connection');


function Dispatcher(configOrConnection, options, events) {
    /**
     * Message dispatcher for SQS workflow.
     *
     * example
     * --------------
     var dispatcher = new Dispatcher({
            endpoint: 'http://localhost:4568',
            apiVersion: '2012-11-05',
            accessKeyId: 'access key',
            secretAccessKey: 'secret access key',
            region: 'us-east-1'
        }, {});

     dispatcher.dispatch('test', {'hello': 'world'});
     **/

    var self = this;
    self.events = events;
    self.connection = Connection(configOrConnection);
    self.config = _.defaults(options || {}, {
        LogLevel: 'DEBUG'      // ['TRACE'|'DEBUG'|'INFO'|'WARN'|'ERROR']
    });
    self.logger = log4js.getLogger('dispatcher');
    self.logger.setLevel(self.config.LogLevel);

    self.getQueueUrl = function (event) {
        if (_.get(self.events, event)) {
            return Promise.resolve(self.events[event]);
        } else {
            return self.connection.getQueue(event)
                .then(function (queue) {
                    if (!queue) return Promise.reject(
                        new Error(util.format("Could not find queue for event: %s", event))
                    );
                    return queue.QueueUrl;
                });
        }
    };

    self.dispatch = function (events, message) {
        events = _.isArray(events) ? events: [events];
        return Promise.each(events, function dispatchEvent(event) {
            return self.getQueueUrl(events)
                .then(function (queueUrl) {
                    return self.connection.sendMessageAsync({
                        MessageBody: JSON.stringify(message),
                        QueueUrl: queueUrl
                    });
                })
                .then(function (message) {
                    self.logger.debug(util.format("dispatched new event: %s, message Id: %s", events, message.MessageId));
                })
                .catch(function (e) {
                    self.logger.error("Dispatch failure: %s", e.toString());
                });
        });
    };
}

module.exports = Dispatcher;