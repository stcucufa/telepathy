export default class Fiber {
    constructor() {
        this.registers = [];
        this.ops = [];
        this.stack = [];
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
            scheduler.setDelayForFiber(this, this.registers[a]);
            if (this.yielded) {
                this.unops.push([Ops.undelay, a]);
            } else {
                this.now += dur;
                this.unops.push([Ops.unnow, a]);
            }
        }
    },

    load(_, a, x) {
        this.registers[a] = x;
    },

    undelay(scheduler, a) {
        scheduler.setDelayForFiber(this, -this.registers[a]);
    },

    unnow(_, a) {
        this.now -= this.registers[a];
    }
};
