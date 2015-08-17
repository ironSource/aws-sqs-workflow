var AWS = require('aws-sdk');
var Promise = require('bluebird');

function Connection(options) {
    var conn = options instanceof AWS.SQS ? options : new AWS.SQS(options);
    conn = Promise.promisifyAll(conn);
    conn.getQueue = function (queue) {
        var params = {
            QueueName: queue
        };
        return conn.getQueueUrlAsync(params)
            .catch(function (err) {
                if (err.code != 'NonExistentQueue') {
                    return Promise.reject(err);
                } else {
                    return self.connection.createQueueAsync(params);
                }
            })
    };

    return conn;
};

module.exports = Connection;