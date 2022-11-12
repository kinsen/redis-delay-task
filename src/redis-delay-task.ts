import IORedis, { Redis, RedisOptions } from 'ioredis';
import { v4 as uuidv1 } from 'uuid';
import StopWatch from './stopwatch';

export default class DelayTasks {

    id?: string;
    redis: Redis;
    callback: Function;
    redisKey: string;
    running: boolean = false;

    private watch: StopWatch;

    // pollIntervalMs: number;
    // pollIntervalId: number | null | undefined;

    constructor(settings: { redis?: Redis | RedisOptions, id?: string, callback?: Function, verbose?: boolean, options?: { pollIntervalMs?: number } } = { verbose: false }) {

        if (typeof settings !== 'object') {
            throw new TypeError('No constructor settings specified');
        }

        // Check ID
        if (typeof settings.id === 'string') {
            this.id = settings.id;
        } else {
            throw new TypeError('Invalid queue ID specified');
        }

        let isRedis = (settings!.redis as Redis).connect !== undefined;
        if (isRedis) {
            this.redis = settings.redis as Redis;
        } else if (typeof settings.redis === 'object') {
            this.redis = new IORedis(settings.redis as RedisOptions);
        } else {
            throw new TypeError('Invalid redis connection options');
        }

        // Callback function for all delayed tasks
        if (typeof settings.callback === 'function') {
            this.callback = settings.callback;
        } else {
            throw new TypeError('Invalid callback function specified');
        }

        // Create the queue name (will be the redis key for the ZSET)
        this.redisKey = `delayed:${this.id}`;

        // Force a settings object
        settings.options = settings.options || {};

        this.watch = new StopWatch();

        // // Poll Interval - how often to poll redis (Default: 1000ms)
        // if (typeof settings.options.pollIntervalMs === 'number' && settings.options.pollIntervalMs > 0) {
        //     this.pollIntervalMs = settings.options.pollIntervalMs;
        // } else {
        //     this.pollIntervalMs = 1000;
        // }

        // this.pollIntervalId = null;
    }

    /**
     * Start polling.
     */
    async start() {
        // this.pollIntervalId = Number(setInterval(this.poll.bind(this), this.pollIntervalMs));

        if (this.running) return;
        this.running = true;

        while (this.running) {
            const arrival = await this.getNextTaskTime();
            await this.watch.waitTo(arrival);

            do {
                await this.poll();
            } while (this.running);

        }
    }

    /**
     * Stops polling.
     */
    stop() {
        // clearInterval(this.pollIntervalId!);
        // this.pollIntervalId = null;

        if(this.running){
            this.running = false;
            this.watch.stop();
        }
    }

    /**
     * Closes up shop.
     */
    close() {
        this.stop();
        this.redis.quit();
    }

    /**
     * Polls redis for tasks.
     */
    poll() {
        const now = new Date().getTime();

        return new Promise((resolve, reject) => {
            this.redis.watch(this.redisKey).then(async it => {
                try {
                    var tasks = await this.redis.zrangebyscore(this.redisKey, 0, now);
                    if (tasks.length > 0) {
                        try {
                            var results = await this.redis.multi().zremrangebyscore(this.redisKey, 0, now).exec();
                            // Success, either that the update was made, or the key changed

                            if (results && results[0] !== null) {
                                // Process tasks
                                tasks
                                    .map(t => JSON.parse(t))
                                    .forEach(t => {
                                        this.callback.call(this, t.data, t.id, t.due);
                                    });
                            }

                            resolve((!results || results[0] === null) ? 0 : results[0]);
                            /**
                             * If results === null, it means that a concurrent client
                             * changed the key while we were processing it and thus
                             * the execution of the MULTI command was not performed.
                             *
                             * NOTICE: Failing an execution of MULTI is not considered
                             * an error. So you will have err === null and results === null
                             */
                        }
                        catch (execError) {
                            reject(execError);
                        }
                    } else {
                        // No changes to make
                        resolve(0);
                    }
                } catch (zrangeErr) {
                    reject(zrangeErr);
                }

            }).catch(err => reject(err));

        });
    }

    /**
     * Adds a task to redis.
     */
    addToRedis(delayedTime: number, task: string) {
        return new Promise((resolve, reject) => {
            this.redis.zadd(this.redisKey, delayedTime, task).then(result => resolve(result)).catch(err => reject(err));
        });
    }

    /**
     * Add a delayed task.
     */
    async add(delayMs: number, data: object) {
        // Validate `delayMs`
        if (typeof delayMs !== 'number' || delayMs <= 0) {
            throw new TypeError('`delayMs` must be a positive integer');
        } else if (data === undefined || data === null) {
            throw new TypeError('No value provided for `data`');
        }

        // Set time to execute
        const delayedTime = new Date().getTime() + delayMs;

        // Create unique task ID
        const taskId = uuidv1();

        // Serialize data
        const task = JSON.stringify({
            id: taskId,
            due: delayedTime,
            data
        });

        await this.addToRedis(delayedTime, task);

        return taskId;
    }

    private async getNextTaskTime() {
        const res = await this.redis.zrange(this.redisKey, 0, 0, 'WITHSCORES');
        if (!res || !res.length) return null;
        return Number(res[1]);
    }

}

exports.DelayTasks = DelayTasks;