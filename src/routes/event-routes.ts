import { Hono } from "hono";
import type { CreateEventRequest } from "../types/create-event-request.js";
import { createEvent, getUserEvents } from "../services/event-services.js";
import type { EventDTO } from "../db/schema.js";

const eventRoutes = new Hono();

eventRoutes.post("/create", async (c) => {
    try {
        const payload = (await c.req.json()) as CreateEventRequest;
        if (
            !payload.name ||
            !payload.start ||
            !payload.end ||
            !payload.location ||
            !payload.description ||
            !payload.user_id ||
            !payload.color
        ) {
            return c.json({ error: "Missing required fields" }, 400);
        }

        const newEvent = await createEvent(payload);
        const eventDto: EventDTO = (({ deleted, ...rest }) => rest)(newEvent);

        return c.json(eventDto, 201);
    } catch (error: any) {
        return c.json({ error: error.message }, 500);
    }
});

eventRoutes.get("/user/:id", async (c) => {
    try {
        const id = c.req.param("id");
        const events = await getUserEvents(id);

        if (!events) return c.json({ error: "Error getting user events" }, 404);

        const safeEvents = events.map((event) => {
            const eventDto: EventDTO = (({ deleted, ...rest }) => rest)(event);
            return eventDto;
        });

        return c.json(safeEvents);
    } catch (error: any) {
        return c.json({ error: error.message }, 500);
    }
});

export default eventRoutes;
