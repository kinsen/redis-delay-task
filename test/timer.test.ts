// jest.useFakeTimers();
// jest.spyOn(global, 'setTimeout');
// jest.spyOn(global, 'setInterval');

function timerGame(callback?: Function) {
    console.log('Ready....go!');
    setTimeout(() => {
        console.log("Time's up -- stop!");
        callback && callback();
    }, 1000);
}

function infiniteTimerGame(callback?: Function) {
    console.log('Ready....go!');

    setTimeout(() => {
        console.log("Time's up! 10 seconds before the next game starts...");
        callback && callback();

        // Schedules the next game in 10 seconds
        setTimeout(() => {
            infiniteTimerGame(callback);
        }, 10000);
    }, 1000);
}


describe("Timer test", () => {

    // Fake timers using Jest
    beforeEach(() => {
        jest.useFakeTimers()
        jest.spyOn(global, 'setTimeout');
        jest.spyOn(global, 'setInterval');
    })

    // Running all pending timers and switching to real timers using Jest
    afterEach(() => {
        jest.runOnlyPendingTimers()
        jest.useRealTimers()

        jest.clearAllMocks();
    })


    test("waits 1 second before ending the game", () => {

        timerGame();

        expect(setTimeout).toHaveBeenCalledTimes(1);
        expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), 1000);
    })

    /**
     * ================================
     * 执行所有的计时器
     * ================================
     * 在本模块内容中，我们想要写的另一个测试是在一秒钟后断言一个回调函数被执行。我们将会使用到 Jest 的计时器控制 API，在测试过程中加速时间进程，以此实现测试内容。
     */
    test('calls the callback after 1 second', () => {
        const callback = jest.fn();

        timerGame(callback);

        // At this point in time, the callback should not have been called yet
        expect(callback).not.toBeCalled();

        // Fast-forward until all timers have been executed
        jest.runAllTimers();

        // Now our callback should have been called!
        expect(callback).toBeCalled();
        expect(callback).toHaveBeenCalledTimes(1);

    });

    /**
     * ================================
     * 执行挂起的计时器(Pending Timer)
     * ================================
     * 存在着你有一个递归计时器的场景——递归计时器是指一个计时器在它自己的回调函数中设置了一个新的计时器。
     * 对于这一类来说，执行所有计时器会导致死循环。
     * 因此类似 jest.runAllTimers() 的代码就不是我们想要的。
     * 对于这种情况，你可能会使用到 jest.runOnlyPendingTimers()
     */
    test('schedules a 10-second timer after 1 second', () => {
        const callback = jest.fn();

        expect(setTimeout).toHaveBeenCalledTimes(0);
        infiniteTimerGame(callback);

        // At this point in time, there should have been a single call to
        // setTimeout to schedule the end of the game in 1 second.
        expect(setTimeout).toHaveBeenCalledTimes(1);
        expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), 1000);

        // Fast forward and exhaust only currently pending timers
        // (but not any new timers that get created during that process)
        jest.runOnlyPendingTimers();

        // At this point, our 1-second timer should have fired its callback
        expect(callback).toBeCalled();

        // And it should have created a new timer to start the game over in
        // 10 seconds
        expect(setTimeout).toHaveBeenCalledTimes(2);
        expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), 10000);
    });

    function timerGame(callback?: Function) {
        console.log('Ready....go!');
        setTimeout(() => {
            console.log("Time's up -- stop!");
            callback && callback();
        }, 1000);
    }

    test('calls the callback after 1 second via advanceTimersByTime', () => {
        const callback = jest.fn();

        timerGame(callback);

        // 在此时间点上，回调函数未被调用
        expect(callback).not.toBeCalled();

        // 加速时间，直到所有计时器都被执行
        jest.advanceTimersByTime(1000);

        // 现在回调函数应该已经被调用了！
        expect(callback).toBeCalled();
        expect(callback).toHaveBeenCalledTimes(1);
    });

    function timeInterval(callback?: Function) {
        setInterval(() => {
            callback!();
        }, 1000)
    }

    test('calls the callback after 1 second via advanceTimersByTime', () => {
        const callback = jest.fn();

        timeInterval(callback);

        // 在此时间点上，回调函数未被调用
        expect(callback).not.toBeCalled();

        // 加速时间，直到所有计时器都被执行
        jest.advanceTimersByTime(1000);

        // 现在回调函数应该已经被调用了！
        expect(callback).toBeCalled();
        expect(callback).toHaveBeenCalledTimes(1);

        jest.advanceTimersByTime(500);
        expect(callback).toHaveBeenCalledTimes(1);

        jest.advanceTimersByTime(500);
        expect(callback).toHaveBeenCalledTimes(2);

        expect(setInterval).toHaveBeenCalledTimes(1);
        expect(setInterval).toHaveBeenLastCalledWith(expect.any(Function), 1000);

        jest.clearAllTimers();
    });
})