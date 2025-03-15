import { eventsTable, type EventDTO } from "../db/schema.js";
import { db } from "../index.js";
import { and, or, eq, gte, lte, ne } from "drizzle-orm";
import type { CreateEventRequest } from "../types/create-event-request.js";

export async function createEvent(event: CreateEventRequest) {
    const eventWithDates = {
        ...event,
        start: new Date(event.start),
        end: new Date(event.end),
    };

    const eventsWithOverlap = await db
        .select()
        .from(eventsTable)
        .where(
            and(
                eq(eventsTable.user_id, eventWithDates.user_id),
                or(
                    and(
                        gte(eventsTable.start, eventWithDates.start),
                        lte(eventsTable.end, eventWithDates.end)
                    ),
                    and(
                        gte(eventsTable.start, eventWithDates.start),
                        lte(eventsTable.start, eventWithDates.end)
                    ),
                    and(
                        gte(eventsTable.end, eventWithDates.start),
                        lte(eventsTable.end, eventWithDates.end)
                    ),
                    and(
                        lte(eventsTable.start, eventWithDates.start),
                        gte(eventsTable.end, eventWithDates.end)
                    )
                )
            )
        );

    if (eventsWithOverlap.length > 0) {
        throw new Error("Event overlap detected");
    }

    const result = await db
        .insert(eventsTable)
        .values(eventWithDates)
        .returning();
    return result[0];
}

export async function editEvent(event: EventDTO) {
    const existingEvent = await db
        .select()
        .from(eventsTable)
        .where(eq(eventsTable.id, event.id));

    if (existingEvent.length === 0) {
        throw new Error("Event not found");
    }

    const eventWithDates = {
        ...event,
        start: new Date(event.start),
        end: new Date(event.end),
    };

    const eventsWithOverlap = await db
        .select()
        .from(eventsTable)
        .where(
            and(
                eq(eventsTable.user_id, eventWithDates.user_id),
                // Exclude current event
                ne(eventsTable.id, eventWithDates.id),
                or(
                    and(
                        gte(eventsTable.start, eventWithDates.start),
                        lte(eventsTable.end, eventWithDates.end)
                    ),
                    and(
                        gte(eventsTable.start, eventWithDates.start),
                        lte(eventsTable.start, eventWithDates.end)
                    ),
                    and(
                        gte(eventsTable.end, eventWithDates.start),
                        lte(eventsTable.end, eventWithDates.end)
                    ),
                    and(
                        lte(eventsTable.start, eventWithDates.start),
                        gte(eventsTable.end, eventWithDates.end)
                    )
                )
            )
        );

    if (eventsWithOverlap.length > 0) {
        throw new Error("Event overlap detected");
    }

    // Update the event
    const result = await db
        .update(eventsTable)
        .set({
            name: eventWithDates.name,
            description: eventWithDates.description,
            location: eventWithDates.location,
            start: eventWithDates.start,
            end: eventWithDates.end,
            color: eventWithDates.color,
        })
        .where(eq(eventsTable.id, eventWithDates.id))
        .returning();

    return result[0];
}

export async function getUserEvents(userId: string) {
    const events = await db
        .select()
        .from(eventsTable)
        .where(eq(eventsTable.user_id, userId));
    return events;
}

export async function getEventsByDate(userId: string, date: Date) {
    // Create the start and end of the day
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Query to filter events that overlap with the selected day
    // (events that start before the end of the day AND end after the start of the day)
    const events = await db
        .select()
        .from(eventsTable)
        .where(
            and(
                eq(eventsTable.user_id, userId),
                lte(eventsTable.start, endOfDay),
                gte(eventsTable.end, startOfDay)
            )
        );

    // Format dates as ISO strings for consistent processing
    return events.map((event) => ({
        ...event,
        start:
            event.start instanceof Date ? event.start : new Date(event.start),
        end: event.end instanceof Date ? event.end : new Date(event.end),
    }));
}
