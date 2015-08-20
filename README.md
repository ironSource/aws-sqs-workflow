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
```Dispatcher``` is the way we 'fire' events so we can trigger operations in our workflow.
```javascript
// define an event dispatcher
var dispatcher = new workflow.Dispatcher();
```
#### Worker
```Worker``` is in charge of the event-polling and execution of workflow operations.

Constructor
    * ```event``` : MQ event.
    * ```options```: object.
        * ```LogLevel```: logging level ['TRACE', 'DEBUG', 'INFO', 'WARN', 'ERROR']. default is 'DEBUG'
        * ```MaxNumberOfMessages```: Integer (?how many messages we shall retrieve upon polling request). default is 10.
        * ```VisibilityTimeout```: Integer (seconds, ?how long we want to lock on this worker). default is 60.
        * ```WaitTimeSeconds```: Integer (seconds, ?how long should we wait for a message). default is 20.
        * ```PollingInterval```: Integer (seconds, ?how often polling is executed). default is 10.

```javascript
var worker = new workflow.Worker('event-name', {});
```
> **NOTE:** Worker must be initialized for events that were previuosly registered to the workflow.
An error will be thrown upon cases where worker is initialized with unknown event.


#### Example (Simple consumer/producer)
```javascript
// register workflow events: ['e1', 'e2']
workflow.addEvents(['e1', 'e2'])
    .then(function() {

        // event dispatcher
        var dispatcher = new workflow.Dispatcher();

        // producer
        var producer = new workflow.Worker('e1', {});
        
        // consumer
        var consumer = new workflow.Worker('e2', {});

        // producer operation will be defined here
        // and the outout will be dispathed to the consumer
        producer.on('message', function(message) {
            // .. process the message  ..
            dispatcher.dispatch('e2', {"result": "hello from worker 1!"});
        });
        
        // consumer operation will be defined here
        consumer.on('message', function(message) {
            // .. process the message  ..
        });

        // start polling
        producer.poll();
        consumer.poll();

        // dispatch an event to start the workflow
        dispatcher.dispatch('e1', {'hello': 'world'});
    })
    .catch(function(e) {
        console.error(e);
    });
```
