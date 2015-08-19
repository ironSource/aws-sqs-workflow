var _ = require('lodash');
var log4js = require('log4js');
var os = require('os');
var util = require('util');
var Promise = require('bluebird');
var Worker = require('./worker');
var Dispatcher = require('./Dispatcher');
var Connection = require('./Connection');

function Workflow(configOrConnection, workflowId) {
    var self = this;
    self.id = workflowId ? workflowId : util.format("%s-%s-%s-%s",
        os.hostname(),
        os.platform(),
        os.arch(),
        os.uptime()
    );

    // Event < --- > Queue Mapping
    self.events = {};

    // Logger
    self.logger = log4js.getLogger(util.format('Workflow [%s]', self.id));
    self.logger.setLevel('DEBUG');
    self.logger.debug("Workflow %s was created", self.id);

    // AWS SQS Service Connection
    self.connection = Connection(configOrConnection, self.logger);

    // Event Dispatcher
    self.Dispatcher = function(options) {
        return new Dispatcher(self.connection, options, self.events);
    };

    // Worker
    self.Worker = function (event, options) {
        var queueUrl = self.events[event];
        if (!queueUrl) throw new Error(util.format("Unknown event: %s", event));
        return new Worker(self.connection, queueUrl, options);
    };

    // Event registration
    self._addEvent = function (event) {
        var eventName = self._getEventName(event);
        return self.connection.getQueue(eventName)
            .then(function (queue) {
                self.logger.debug("New event: %s, Queue URL: %s", event, queue.QueueUrl);
                self.events[event] = queue.QueueUrl;
            })
            .catch(function (err) {
                self.logger.error("Could not add event %s to workflow: %s", event, err.toString());
            });
    };

    self.addEvents = function() {
        return Promise.each(_.values(arguments), self._addEvent);
    };

    // Get event full name
    self._getEventName = function (event) {
        return util.format("%s-%s", self.id, event);
    };
}

module.exports = Workflow;