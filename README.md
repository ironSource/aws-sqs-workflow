# aws-sqs-workflow

## Overview
Simple Workflow abstraction on top of Amazon SQS Service.
See https://aws.amazon.com/sqs/ for more details on AWS SQS.
See http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/SQS.html for
the AWS SQS SDK in Javascript/Node.js.

# Quick Start

#### Install (in the future)
```sh
npm install aws-sqs-workflow
```

After the installation, you can start using the package;

```javascript
var SQSWorkflow = require('aws-sqs-workflow');
var Connection = SQSWorkflow.Connection;
var Workflow = SQSWorkflow.Workflow;
```

#### Create a connection
Creating a connection is simply a short circuit to AWS.SQS class constuctor.
```Connection``` should receive an ```options``` object as explained here: http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/SQS.html#constructor-property

In this example, we use the fake_sqs tool to test things locally.
See: https://github.com/iain/fake_sqs for a quick start of this tool.

```javascript
var connection = Connection({
    endpoint: 'http://localhost:4568',
    apiVersion: '2012-11-05',
    accessKeyId: 'access key',
    secretAccessKey: 'secret access key',
    region: 'us-east-1'
});
```

#### Declare a workflow
```Workflow``` receives a connection (as explained above) and also an ```options``` 
object for setting up few things for the workflow:
   * ```LogLevel```: logging level ['TRACE', 'DEBUG', 'INFO', 'WARN', 'ERROR']
   * ```Id```: Workflow Id. This might be useful when trying to connect to an existing workflow. 

```javascript
// create a new workflow
var workflow = new Workflow(connection);
```

#### Event Registeration

First thing we want to do is to declare some events that will be triggered during the
workflow lifetime. In the lower level implementation, each event will be handled by a dedicated
message queue and therfore we must define the events befoere we start working with messages to ensure
we non existing queues are addressed at runtime.

```javascript
// register workflow events: ['e1', 'e2']
workflow.addEvents('e1', 'e2')
    .then(function() {
        ..
    })
    .catch(function(e) {
        ..
    });
```

#### Dispatcher
```Dispatcher``` is an event dispatcher to 'fire' events in order to trigger
some workflow operations.
```javascript
// define an event dispatcher
var dispatcher = new workflow.Dispatcher();
```

```javascript
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
