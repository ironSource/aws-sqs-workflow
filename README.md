# aws-sqs-workflow
Simple Workflow abstraction on top of Amazon SQS Service

# Installation (In the future)
```bash
npm install aws-sqs-workflow
```

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

// create a new workflow
var workflow = new Workflow(connection);

// or connect to an existing workflow
// var workflow = new Workflow(connection, 'some workflow identifier');

// register workflow events: ['e1', 'e2']
workflow.addEvents('e1', 'e2')
    .then(function() {

        // create an event dispatcher
        var dispatcher = new workflow.Dispatcher();

        // create some dummy workers
        var worker1 = new workflow.Worker('e1', {});
        var worker2 = new workflow.Worker('e2', {});

        // pass the result of worker1 to worker2
        worker1.on('message', function(message) {
            // .. process the message  ..
            dispatcher.dispatch('e2', {"result": "hello from worker 1!"});
        });

        worker2.on('message', function(message) {
            // .. process the message  ..
        });

        // start polling
        worker1.poll();
        worker2.poll();

        // dispatch an event to start the workflow
        dispatcher.dispatch('e1', {'hello': 'world'});

        // or dispatch multiple events at a time
        // dispatcher.dispatch(['e1', 'e2', {'hello': 'world'}];
    })
    .catch(function(e) {
        console.error(e);
    });
```
