// jest.useFakeTimers();
// jest.spyOn(global, 'setTimeout');
// jest.spyOn(global, 'setInterval');
import StopWatch from '../src/stopwatch';

let sw: StopWatch

describe("StopWatch test", () => {

    // Fake timers using Jest
    beforeEach(() => {
        jest.useFakeTimers()
        jest.spyOn(global, 'setTimeout');
        jest.spyOn(global, 'setInterval');

        sw = new StopWatch();
    })

    // Running all pending timers and switching to real timers using Jest
    afterEach(() => {
        jest.runOnlyPendingTimers()
        jest.useRealTimers()
        jest.clearAllMocks();

        sw?.stop();
    })


    test("basic use", (done) => {
        var now = new Date().getTime();
        var arrivalAt = now + 2000;
        const callback = jest.fn();

        sw.waitTo(now).then(()=> {
            callback();
            expect(new Date().getTime()).toBeGreaterThanOrEqual(arrivalAt);
            console.log("hello");

            expect(callback).toHaveBeenCalledTimes(1);
            done();
        });

        jest.advanceTimersByTime(1000);

        expect(callback).not.toBeCalled();
        expect(callback).toHaveBeenCalledTimes(0);

        jest.advanceTimersByTime(2000);
    })

    test("notify", (done) => {
        var now = new Date().getTime();
        var arrivalAt = now + 10000;
        const callback = jest.fn();

        sw.waitTo(now).then(()=> {
            callback();
            expect(new Date().getTime()).toBeGreaterThanOrEqual(now + 2000);
            console.log("hello");

            expect(callback).toHaveBeenCalledTimes(1);
            done();
        });

        expect(callback).not.toBeCalled();
        expect(callback).toHaveBeenCalledTimes(0);

        sw.notify(now + 2000);
        jest.advanceTimersByTime(2000);
    })

    test("notify2", (done) => {
        var now = new Date().getTime();
        var arrivalAt = now + 10000;
        const callback = jest.fn();

        sw.waitTo(null).then(()=> {
            callback();
            expect(new Date().getTime()).toBeGreaterThanOrEqual(now + 2000);
            console.log("hello");

            expect(callback).toHaveBeenCalledTimes(1);
            done();
        });

        expect(callback).not.toBeCalled();
        expect(callback).toHaveBeenCalledTimes(0);

        sw.notify(now + 2000);
        jest.advanceTimersByTime(2000);
    })

})