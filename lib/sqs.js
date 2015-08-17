var AWS = require('aws-sdk');
var Promise = require('bluebird');

module.exports.getConnection = function(configOrConnection) {
    if (!(configOrConnection instanceof AWS.SQS))
        configOrConnection = new AWS.SQS(configOrConnection);
    return Promise.promisifyAll(configOrConnection);
};