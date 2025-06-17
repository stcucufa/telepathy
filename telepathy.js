import Scheduler from "./epistrophy/lib/scheduler.js";
import { First } from "./epistrophy/lib/fiber.js";

Scheduler.run().
    repeat(fiber => fiber.
        event(document, "pointerdown", {
            eventWasHandled(event, fiber) {
                fiber.value = event;
                event.preventDefault();
            }
        }).
        exec(({ value: event }) => {
            const line = document.querySelector("svg").appendChild(
                document.createElementNS("http://www.w3.org/2000/svg", "line")
            );
            line.setAttribute("x1", event.clientX);
            line.setAttribute("x2", event.clientX);
            line.setAttribute("y1", event.clientY);
            line.setAttribute("y2", event.clientY);
            line.setAttribute("stroke", "#1d2b53");
            return line;
        }).
        spawn(fiber => fiber.
            repeat(fiber => fiber.
                event(document, "pointermove", {
                    eventWasHandled(event, { value: line }) {
                        line.setAttribute("x2", event.clientX);
                        line.setAttribute("y2", event.clientY);
                    }
                })
            )
        ).
        spawn(fiber => fiber.event(document, "pointerup")).
        spawn(fiber => fiber.event(document, "pointercancel")).
        join(First())
    );
