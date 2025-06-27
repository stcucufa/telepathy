export default class Fiber {
    constructor() {
        this.registers = [];
        this.ops = [];
    }

    op(op, ...args) {
        this.ops.push([Ops[op], ...args]);
        return this;
    }
}

const Ops = {
    add(_, a, b, c) {
        this.unops.push([Ops.load, a, this.registers[a]]);
        this.registers[a] = this.registers[b] + this.registers[c];
    },

    delay(scheduler, a) {
        const dur = this.registers[a];
        if (typeof dur === "number" && dur > 0) {
            delay(this, scheduler, dur);
            this.unops.push([Ops.undelay, a]);
        }
    },

    load(_, a, x) {
        this.registers[a] = x;
    },

    undelay(scheduler, a) {
        dealy(this, scheduler, -this.registers[a]);
    }
};

function delay(fiber, scheduler, dur) {
    scheduler.setDelayForFiber(fiber, dur);
    if (!fiber.yielded) {
        fiber.now += dur;
    }
}
