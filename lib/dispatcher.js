var _ = require('lodash');
var log4js = require('log4js');
var util = require('util');

var Connection = require('./connection');

function Dispatcher(configOrConnection, options) {
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
    self.connection = Connection(configOrConnection);
    self.config = _.defaults(options || {}, {
        LogLevel: 'INFO'      // ['TRACE'|'DEBUG'|'INFO'|'WARN'|'ERROR']
    });

    self.logger = log4js.getLogger('dispatcher');
    self.logger.setLevel(self.config.LogLevel);

    self.dispatch = function (queue, message) {
        return self.connection.getQueue(queue)
            .then(function (queue) {
                return self.connection.sendMessageAsync({
                    MessageBody: JSON.stringify(message),
                    QueueUrl: queue.QueueUrl
                });
            })
            .then(function(message) {
                self.logger.debug(util.format("dispatched new event: %s, message Id: %s", queue, message.MessageId));
            })
            .catch(function (e) {
                self.logger.error("Dispatch failure: %s", e.toString());
            });
    };
}

module.exports = Dispatcher;