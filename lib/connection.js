var AWS = require('aws-sdk');
var Promise = require('bluebird');

function Connection(options, logger) {
    var conn = options instanceof AWS.SQS ? options : new AWS.SQS(options);
    conn = Promise.promisifyAll(conn);
    conn.logger = logger;
    conn.getQueue = function (queue) {
        var params = {
            QueueName: queue
        };
        return conn.getQueueUrlAsync(params)
            .catch(function (err) {
                if (err.code != 'NonExistentQueue') {
                    return Promise.reject(err);
                } else {
                    conn.logger && conn.logger.debug("Queue %s does not exist, creating it", queue);
                    return conn.createQueueAsync(params);
                }
            })
    };
    return conn;
};

module.exports = Connection;