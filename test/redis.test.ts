
import IORedis, {Redis,RedisOptions} from 'ioredis';
import { v4 as uuidv1 } from 'uuid';

// jest.useFakeTimers();
jest.useFakeTimers({ doNotFake: ['nextTick'] })
jest.spyOn(global, 'setTimeout');
jest.spyOn(global, 'setInterval');



const redis = new IORedis({
    host: '127.0.0.1',
    port: 6379
});

const redisKey = "delayed-test";


describe("Redis test", () => {

    test("test zadd",async () => {
        
        console.log(new Date().toLocaleString());
        jest.useRealTimers()

        var result = await redis.zadd(redisKey, 100, "TEST");
        await redis.zadd(redisKey, 102, "TEST2");

        var result1 = await redis.watch(redisKey);
        expect(result1).toBe("OK");
        console.log(result1);

        const now = new Date().getTime();
        var tasks = await redis.zrangebyscore(redisKey,0, now);
        console.log(tasks);

        var results = await redis.multi().zremrangebyscore(redisKey,0,now).exec();
        console.log(results);
    })
})