# redis-delay-task

## Installation

----

```bash
$ npm i redis-delay-task
```

## Usage

----

```typescript
import DelayTasks from "redis-delay-task";

const dt = new DelayTasks({
    id: 'http-retry',
    redis: {
        host: '127.0.0.1',
        port: 6379
    },
    callback: function (data: any, taskId: any, dueTime: any){
        console.log("callback...");
        // A task is ready to be tried again
        try {
            request(data);
        } catch (e) {
            // console.error(this);
            // It failed again, try in another 1 seconds
            (this! as DelayTasks).add(1000, data);
        }
    }
});

// Start polling
dt.start();

try {
    // `request` would be your http request library of choice
    request({
        method: 'POST',
        url: '/foo',
        data: { foo: 'bar' }
    });

} catch (e) {
    // There was an error, try again in 1 seconds
    dt.add(1000, {data:{foo:"bar"}});
}
```