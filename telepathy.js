import Scheduler from "./epistrophy/lib/scheduler.js";

Scheduler.run().
    effect(() => { console.info("TELEPATHY"); });
