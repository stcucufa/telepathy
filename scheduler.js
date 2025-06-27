import { default as Epistrophy } from "./epistrophy/lib/scheduler.js";
import Fiber from "./fiber.js";

export default class Scheduler extends Epistrophy {
    static run() {
        const scheduler = new Scheduler();
        const fiber = new Fiber();
        scheduler.clock.start();
        scheduler.resetFiber(fiber);
        scheduler.resumeFiber(fiber);
        return fiber;
    }

    resetFiber(fiber) {
        fiber.beginTime = this.now;
        fiber.now = 0;
        delete fiber.endTime;
        fiber.rate = fiber.parent?.rate ?? 1;
        fiber.ownRate = 1;
        fiber.ip = 0;
        fiber.unops = [];
    }

    runFiber(fiber) {
        while (!fiber.yielded) {
            if (fiber.rate > 0 && fiber.ip < fiber.ops.length) {
                const [op, ...args] = fiber.ops[fiber.ip++];
                op.call(fiber, this, ...args);
            } else if (fiber.rate < 0 && fiber.unip > 0) {
                const [op, ...args] = fiber.unops[--fiber.unip];
                op.call(fiber, this, ...args);
            } else {
                break;
            }
        }
        if (!fiber.yielded) {
            this.fiberEnded(fiber);
        }
    }

    // Execute all fibers scheduled in the [begin, end[ interval, then update
    // all ramps.
    update(begin, end) {
        console.assert(this.instants.length === 0 || this.instants[0] >= begin);
        while (this.instants.length > 0 && this.instants[0] >= begin && this.instants[0] < end) {
            this.now = this.instants.remove();
            // FIXME 4K0L Custom undo
            this.lastInstant = this.now;
            const queue = this.fibersByInstant.get(this.now);
            this.fibersByInstant.delete(this.now);
            while (queue.length > 0) {
                const fiber = this.currentFiber = queue.shift();
                console.assert(this.instantsByFiber.get(fiber) === this.now);
                this.instantsByFiber.delete(fiber);
                if (this.delays.has(fiber)) {
                    fiber.now = this.delays.get(fiber).fiberEnd;
                    this.delays.delete(fiber);
                }
                delete fiber.yielded;
                fiber.lastUpdateTime = this.now;
                this.resumeQueues = [[], []];
                this.runFiber(fiber);
                Array.prototype.unshift.apply(queue, this.resumeQueues[1]);
                Array.prototype.unshift.apply(queue, this.resumeQueues[0]);
            }
        }
        delete this.resumeQueues;
        delete this.currentFiber;
        this.now = end;
        for (const [fiber, { delegate, begin, dur, rate, fiberBegin }] of this.ramps.entries()) {
            if (!fiber.handleResult || fiber.rate === 0) {
                continue;
            }
            const p = (this.now - begin) / (dur / rate);
            console.assert(p >= 0 && p <= 1);
            if (p < 1) {
                // The delegate is called with p = 1 when the ramp ends.
                fiber.now = fiberBegin + p * dur;
                delegate.rampDidProgress?.call(delegate, p, fiber, this);
            }
        }
        if (this.instants.length > 0) {
            this.clock.advance();
        }
    }
}
