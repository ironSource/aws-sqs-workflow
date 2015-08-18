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

// create some dummy workers
var worker1 = new workflow.Worker('q1', {});
var worker2 = new workflow.Worker('q2', {});

// create an event dispatcher
var dispatcher = new workflow.Dispatcher();

// pass the result of worker1 to worker2
worker1.on('message', function(message) {
    dispatcher.dispatch('q2', {"result": "hello from worker 1!"});
});

worker2.on('message', function(message) {
    // do something here ..
});

// start polling
worker1.poll();
worker2.poll();

// dispatch an event to start the workflow
dispatcher.dispatch('q1', {'hello': 'world'});
```
