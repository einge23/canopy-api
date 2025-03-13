import { Hono } from "hono";
import type { CreateEventRequest } from "../types/create-event-request.js";
import {
    createEvent,
    editEvent,
    getEventsByDate,
    getUserEvents,
} from "../services/event-services.js";
import type { EventDTO } from "../db/schema.js";
import { clerkAuth } from "../middleware/clerk-auth.js";

const eventRoutes = new Hono();

eventRoutes.post("/create", clerkAuth, async (c) => {
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
    } catch (error) {
        console.log(error);
        return c.json({ error }, 500);
    }
});

eventRoutes.get("/user/:id", clerkAuth, async (c) => {
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

eventRoutes.put("/edit", clerkAuth, async (c) => {
    try {
        const request = (await c.req.json()) as EventDTO;

        // Use c.var instead of c.get for type-safe access

        // Check if all required fields are present
        if (!request || !request.id || !request.user_id) {
            return c.json({ error: "Missing required fields" }, 400);
        }

        // Verify user is editing their own event
        // Get user ID from session

        const updatedEvent = await editEvent(request);
        return c.json(updatedEvent);
    } catch (error) {
        return c.json({ error: "Invalid request body" }, 400);
    }
});

eventRoutes.get("/:user_id/:date", clerkAuth, async (c) => {
    try {
        const { user_id, date } = c.req.param();

        const events = await getEventsByDate(user_id, new Date(date));

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
