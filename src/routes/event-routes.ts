import { Hono } from "hono";
import type { CreateEventRequest } from "../types/create-event-request.js";
import {
    createEvent,
    deleteEvent,
    editEvent,
    getEventsByDate,
    getUserEvents,
} from "../services/event-services.js";
import { serializeEvent, type EventDTO } from "../db/schema.js";
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

        // Check if all required fields are present
        if (!request || !request.id || !request.user_id) {
            return c.json({ error: "Missing required fields" }, 400);
        }

        const updatedEvent = await editEvent(request);
        return c.json(updatedEvent);
    } catch (error) {
        console.error("Error updating event:", error);
        return c.json(
            {
                error: "Failed to update event",
                details:
                    error instanceof Error ? error.message : "Unknown error",
            },
            400
        );
    }
});

eventRoutes.get("/:user_id/:date", clerkAuth, async (c) => {
    try {
        const { user_id, date } = c.req.param();

        const events = await getEventsByDate(user_id, new Date(date));

        if (!events) return c.json({ error: "Error getting user events" }, 404);

        // Convert to serialized format for API response
        const safeEvents = events.map((event) => {
            // Remove deleted field
            const { deleted, ...rest } = event;

            // Use your serialization helper
            return serializeEvent(rest);
        });

        return c.json(safeEvents);
    } catch (error: any) {
        return c.json({ error: error.message }, 500);
    }
});

eventRoutes.delete("/:id", clerkAuth, async (c) => {
    try {
        const id = c.req.param("id");

        if (!id) return c.json({ error: "Missing event ID" }, 400);

        const deletedEvent = await deleteEvent(parseInt(id));

        return c.json(deletedEvent);
    } catch (error: any) {
        return c.json({ error: error.message }, 500);
    }
});

export default eventRoutes;
