# aws-sqs-workflow
Simple Workflow abstraction on top of Amazon SQS Service

# Installation
npm install aws-sqs-workflow

# Usage
```javascript
var workflow = require('aws-sqs-workflow');
var Sqs = workflow.Sqs;
var Worker = workflow.Worker;
var Dispatcher = worker.Dispatcher;

var connection = Sqs.getConnection({
    endpoint: 'http://localhost:4568',
    apiVersion: '2012-11-05',
    accessKeyId: 'access key',
    secretAccessKey: 'secret access key',
    region: 'us-east-1'
});

var dispatcher = new Dispatcher(connection);
var worker = new Worker(connection, {QueueUrl: 'http://localhost:4568/test'});

dispatcher.dispatch('test', {'hello': 'world'});
worker.poll();
```
