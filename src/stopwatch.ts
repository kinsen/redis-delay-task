import { logger } from './logger';

// setTimeout max val
const MAX_INTERVAL = 2147483647;

export default class StopWatch {
    private timer?: NodeJS.Timeout | number| null;      // 计时器
    arrivalTime?: number | null;        // 计时到达点
    private pendingFn?: (()=>void) | null;      // 调用此方法解除阻塞

    constructor() {
        this.reset();
    }

    // 阻塞至时间点到达
    public async waitTo(arrivalTime: number | null | undefined) {
        const now = Date.now();

        // 已经到达，不阻塞，直接返回
        if (arrivalTime != null && arrivalTime <= now) return;

        if (arrivalTime == null) arrivalTime = now + MAX_INTERVAL;
        if (arrivalTime > now + MAX_INTERVAL) arrivalTime = now + MAX_INTERVAL;


        this.arrivalTime = arrivalTime!;

        // 重置
        if (this.timer) {
            clearTimeout(this.timer as number);
            this.timer = null;
        }
        if (this.pendingFn) this.pendingFn = null;

        await new Promise<void>((resolve) => {
            this.pendingFn = resolve;
            const interval = this.arrivalTime! - now;
            this.timer = setTimeout(() => {
                this.finishWait();
            }, interval);
            logger.debug('timer next interval:', interval);
        });
    }

    public stop(){
        this.finishWait();
    }

    // 通知修改内部阻塞计时器
    public notify(arrivalTime: number) {
        // 当前不阻塞
        if (!this.pendingFn) return;

        // 在当前计时点之后，不做修改
        if (arrivalTime >= this.arrivalTime!) return;

        logger.debug('timer new arrivalTime', arrivalTime);

        // 重置计时器
        if (this.timer) {
            clearTimeout(this.timer as number);
            this.timer = null;
        }
        this.arrivalTime = arrivalTime;
        const interval = this.arrivalTime - Date.now();
        if (interval <= 0) return this.finishWait();

        // 开始新的计时器
        this.timer = setTimeout(() => {
            this.finishWait();
        }, interval);
        logger.debug('timer new next interval:', interval);
    }

    private reset() {
        this.timer = null;
        this.arrivalTime = Date.now() + MAX_INTERVAL;
        this.pendingFn = null;
    }

    // 结束阻塞
    private finishWait() {
        logger.debug('timer finish wait');
        const resolve = this.pendingFn;
        this.reset();
        if(resolve)
            resolve();
    }
}