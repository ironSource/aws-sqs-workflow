var _ = require('lodash');
var Worker = require('./worker');
var Dispatcher = require('./Dispatcher');
var Connection = require('./Connection');

function Workflow(configOrConnection) {
    var self = this;
    self.events = {};
    self.queues = {};
    self.connection = Connection(configOrConnection);
    self.Dispatcher = _.partial(Dispatcher, self.connection);
    self.Worker = _.partial(Worker, self.connection);
}

module.exports = Workflow;