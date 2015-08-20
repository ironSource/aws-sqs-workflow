var _ = require('lodash');
var log4js = require('log4js');
var os = require('os');
var util = require('util');
var Promise = require('bluebird');
var Worker = require('./worker');
var Dispatcher = require('./Dispatcher');
var Connection = require('./Connection');

function Workflow(configOrConnection, options) {
    var self = this;

    // Options
    self.options = _.defaults(options || {}, {
        LogLevel: 'DEBUG',      // ['TRACE'|'DEBUG'|'INFO'|'WARN'|'ERROR'],
        Id: util.format("%s-%s-%s-%s",
            os.hostname(),
            os.platform(),
            os.arch(),
            os.uptime()
        )
    });

    // Event < --- > Queue Mapping
    self.events = {};

    // Worker lookup table
    self.workers = {};

    // Logger
    self.logger = log4js.getLogger(util.format('Workflow [%s]', self.options.Id));
    self.logger.setLevel(self.options.LogLevel);
    self.logger.debug("Workflow %s was created", self.options.Id);

    // AWS SQS Service Connection
    self.connection = Connection(configOrConnection, self.logger);

    // Event Dispatcher
    self.Dispatcher = function (options) {
        options = options || {};
        options.LogLevel = self.options.LogLevel;
        return new Dispatcher(self.connection, options, self.events);
    };

    // Worker
    self.Worker = function (event, options) {
        var worker;
        var queueUrl = _.get(self.events, event);
        if (!queueUrl) throw new Error(util.format("Unknown event: %s", event));
        options = options || {};
        options.LogLevel = self.options.LogLevel;
        worker = new Worker(self.connection, queueUrl, options);
        self.workers[worker.name] = worker;
        return worker;
    };

    // Event registration
    self.addEvents = function (events) {
        return Promise.each(events, function addEvent(event) {
            var eventName = self._getEventName(event);
            return self.connection.getQueue(eventName)
                .then(function (queue) {
                    self.logger.debug("New event: %s, Queue URL: %s", event, queue.QueueUrl);
                    self.events[event] = queue.QueueUrl;
                })
                .catch(function (err) {
                    self.logger.error("Could not add event %s to workflow: %s", event, err.toString());
                });
        });
    };

    // Event de-registeration
    self.removeEvents = function(events) {
        return Promise.each(events, function(event) {
            var eventName = self._getEventName(event);
            return self.connection.getQueue(eventName)
                .then(function(queue) {
                    return self.connection.deleteQueueAsync({
                       QueueUrl: queue.QueueUrl
                    });
                })
                .catch(function(err) {
                    self.logger.error("Purge failed due to %s", err);
                })
        });
    };

    // Get event full name
    self._getEventName = function (event) {
        return util.format("%s-%s", self.options.Id, event);
    };
}

module.exports = Workflow;