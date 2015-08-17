var Promise = require('bluebird');
var log4js = require('log4js');
var Connection = require('./connection');
var util = require('util');

function Dispatcher(configOrConnection) {
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
        });

        dispatcher.dispatch('test', {'hello': 'world'});
     **/

    var self = this;
    self.logger = log4js.getLogger('dispatcher');
    self.logger.setLevel('DEBUG');
    self.connection = Connection(configOrConnection);

    self.dispatch = function (queue, message) {
        return self.connection.getQueue(queue)
            .then(function (queue) {
                return self.connection.sendMessageAsync({
                    MessageBody: JSON.stringify(message),
                    QueueUrl: queue.QueueUrl
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