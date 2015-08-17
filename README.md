# aws-sqs-workflow
Simple Workflow abstraction on top of Amazon SQS Service

# Installation (In the future)
npm install aws-sqs-workflow

# Usage

## Require
```javascript
var workflow = require('aws-sqs-workflow');
var Connection = workflow.Connection;
var Worker = workflow.Worker;
var Dispatcher = worker.Dispatcher;

var connection = Connection({
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

function Worker1() {
    Worker1.call(this);
}

function Worker2() {
    Worker2.call(this);
}

util.inherits(Worker1, Worker);
util.inherits(Worker2, Worker);

Worker1.prototype.processMessage = function (message) {
    // do the thing here, in our case we just print the message
    console.log('worker1', message);
    // remove message from queue
    return this.deleteMessage(message)
        .then(function() {
            dispatcher.dispatch('q2', {'key': 'value'});
        });
};

Worker2.prototype.processMessage = function (message) {
    // do the thing here, in our case we just print the message
    console.log('worker2', message);
    // remove message from queue
    return this.deleteMessage(message);
};
```

## Starting a workflow using a dispatcher

```javascript
// create an event dispatcher
var dispatcher = new Dispatcher(connection);

// initiate one worker for each task
var worker1 = new Worker1(connection, 'q1', {});
var worker2 = new Worker2(connection, 'q2', {});

// start polling
worker1.poll();
worker2.poll();

// fire the first event to start the workflow
dispatcher.dispatch('test', {'hello': 'world'});
```
