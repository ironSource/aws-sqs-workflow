# aws-sqs-workflow
Simple Workflow abstraction on top of Amazon SQS Service

# Installation (In the future)
npm install aws-sqs-workflow

# Usage

## Require
```javascript
var SQSWorkflow = require('aws-sqs-workflow');
var Connection = SQSWorkflow.Connection;
var Workflow = SQSWorkflow.Workflow;
```

## Create a connection
```javascript
var connection = Connection({
    endpoint: 'http://localhost:4568',
    apiVersion: '2012-11-05',
    accessKeyId: 'access key',
    secretAccessKey: 'secret access key',
    region: 'us-east-1'
});
```

## Define a workflow
```javascript

// create a workflow
var workflow = new Workflow(connection);

// create new worker
var worker1 = new workflow.Worker('q1', {});
var worker2 = new workflow.Worker('q2', {});

// create an event dispatcher
var dispatcher = new workflow.Dispatcher();

// dummy workers don't really do nothing
// and call complete to make sure message will be
// removed from the message queue.
worker1.on('message', function(message) {
    worker1.complete(message);
});

worker2.on('message', function(message) {
    worker2.complete(message);
});

// when worker1 completes, it should re-dispatch the message
worker1.on('complete', function(message) {
    dispatcher.dispatch('q2', JSON.parse(message.Body));
});

// start polling
worker1.poll();
worker2.poll();

// dispatch an event to start the workflow
dispatcher.dispatch('q1', {'hello': 'world'});
```
