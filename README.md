# aws-sqs-workflow
Simple Workflow abstraction on top of Amazon SQS Service

# Installation (In the future)
npm install aws-sqs-workflow

# Usage
```javascript
var Connection = require('./lib/connection');
var Worker = require('./lib/worker');
var Dispatcher = require('./lib/dispatcher');

var connection = Connection({
    endpoint: 'http://localhost:4568',
    apiVersion: '2012-11-05',
    accessKeyId: 'access key',
    secretAccessKey: 'secret access key',
    region: 'us-east-1'
});

// create new worker
var worker1 = new Worker(connection, 'q1', {});
var worker2 = new Worker(connection, 'q2', {});
var dispatcher = new Dispatcher(connection);

// pass the result of worker1 to worker2
worker1.on('complete', function(message) {
    dispatcher.dispatch('q2', JSON.parse(message.Body));
});

// start polling
worker1.poll();
worker2.poll();

// dispatch first event to start the work flow
dispatcher.dispatch('q1', {'hello': 'world'});
```
