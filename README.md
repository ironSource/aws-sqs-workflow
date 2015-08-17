# aws-sqs-workflow
Simple Workflow abstraction on top of Amazon SQS Service

# Installation
npm install aws-sqs-workflow

# Usage

## Require
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
```

## Define a worker
```javascript
var util = require('util');

function DummyWorker() {
    Worker.call(this);
}

util.inherits(DummyWorker, Worker);

DummyWorker.prototype.processMessage = function (message) {
    // do the thing here, in our case we just print the message
    console.log(messagge);
    // remove message from queue
    this.deleteMessage(message);
};
```javascript

## Starting a workflow
```javascript

var dispatcher = new Dispatcher(connection);
var worker = new DummyWorker(connection, {QueueUrl: 'http://localhost:4568/test'});

dispatcher.dispatch('test', {'hello': 'world'});
worker.poll();
```
