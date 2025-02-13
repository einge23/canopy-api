import { eventsTable } from "../db/schema.js";
import { db } from "../index.js";
import { eq } from "drizzle-orm";
import type { CreateEventRequest } from "../types/create-event-request.js";

export async function createEvent(event: CreateEventRequest) {
    const eventWithDates = {
        ...event,
        start: new Date(event.start),
        end: new Date(event.end),
    };
    const result = await db
        .insert(eventsTable)
        .values(eventWithDates)
        .returning();
    return result[0];
}

export async function getUserEvents(userId: number) {
    const events = await db
        .select()
        .from(eventsTable)
        .where(eq(eventsTable.user_id, userId));
    return events;
}
