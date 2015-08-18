# aws-sqs-workflow
Simple Workflow abstraction on top of Amazon SQS Service

# Installation (In the future)
npm install aws-sqs-workflow

# Usage

## Require
```javascript
var Workflow = require('aws-sqs-workflow');
var Connection = Workflow.Connection;
var Worker = Workflow.Worker;
var Dispatcher = Workflow.dispatcher;
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
// create new worker
var worker1 = new Worker(connection, 'q1', {});
var worker2 = new Worker(connection, 'q2', {});
var dispatcher = new Dispatcher(connection);

// pass the result of worker1 to worker2
worker1.on('message', function(message) {
    worker1.complete(message);
});

// when worker1 completes, it should re-dispatch the message
worker1.on('complete', function(message) {
    dispatcher.dispatch('q2', JSON.parse(message.Body));
});

// start polling
worker1.poll();
worker2.poll();

// dispatch first event to start the work flow
dispatcher.dispatch('q1', {'hello': 'world'});
```
