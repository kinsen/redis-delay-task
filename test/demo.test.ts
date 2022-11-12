import IORedis, {Redis,RedisOptions} from 'ioredis';
import DelayTasks from "../src"

// https://github.com/nock/nock/issues/2200#issuecomment-1139500237
jest.useFakeTimers({ doNotFake: ['nextTick'] })
jest.spyOn(global, 'setTimeout');
jest.spyOn(global, 'setInterval');
// // Use jest.setTimeout(newTimeout) to increase the timeout value, if this is a long-running test."
// jest.setTimeout(10000);

// function request(data: any) {
//     console.log("request:", data);
//     throw new Error("request error");
// }

const redis = new IORedis({
    host: '127.0.0.1',
    port: 6379
});
// const redis = new Redis();

function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Dummy test
 */
describe("Dummy test", () => {


    // afterEach((done) => {
    //     jest.useRealTimers();
    //     redis.disconnect()
    // })
    
    test("DummyClass is instantiable", async () => {

        const request = jest.fn((arg) => {throw new Error()});

        const callback = jest.fn((data: any, taskId: any, dueTime: any) => {
            console.log("callback...");
            // A task is ready to be tried again
            try {
                request(data);
            } catch (e) {
                console.error(e);
                // It failed again, try in another 5 seconds
                // (this as DelayTasks).add(5000, data);
            }
        });

        const dt = new DelayTasks({
            id: 'http-retry',
            redis: redis,
            callback: callback
        });

        expect(dt.pollIntervalMs).toBe(1000);

        // Start polling
        dt.start();

        const addDelay = jest.fn(dt.add);

        expect(request).not.toBeCalled();


        var tasks = await redis.zrangebyscore(dt.redisKey, 0, new Date().getTime());
        expect(tasks).not.toBeNull();
        expect(tasks).not.toBeUndefined();
        expect(tasks.length).toBe(0);

        try {
            // `request` would be your http request library of choice
            request({
                method: 'POST',
                url: '/foo',
                data: { foo: 'bar' }
            });

        } catch (e) {
            // There was an error, try again in 5 seconds
            dt.add(5000, {data:{foo:"bar"}});
        }

        tasks = await redis.zrangebyscore(dt.redisKey, 0, new Date().getTime() + 5000);
        expect(tasks.length).toBeGreaterThan(0);

        expect(callback).not.toBeCalled();
        expect(callback).toHaveBeenCalledTimes(0);

        expect(request).toBeCalled();
        expect(request).toHaveBeenCalledTimes(1);

        // expect(addDelay).toHaveBeenCalledTimes(1);

        jest.advanceTimersByTime(8000);
        // await delay(5000);


        // expect(callback).toBeCalled();
        // expect(callback).toHaveBeenCalledTimes(1);

        // expect(request).toHaveBeenCalledTimes(2);


        jest.clearAllTimers();
        // Don't forget to clean up later: `dt.stop()`
        dt.stop();

    })
    
})
