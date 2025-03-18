import { eventsTable, type EventDTO } from "../db/schema.js";
import { db } from "../index.js";
import { and, or, eq, gte, lte, ne, asc } from "drizzle-orm";
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
                eq(eventsTable.deleted, false), // Only check non-deleted events
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
                eq(eventsTable.deleted, false),
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
        .where(
            and(
                eq(eventsTable.id, eventWithDates.id),
                eq(eventsTable.user_id, eventWithDates.user_id)
            )
        )
        .returning();

    return result[0];
}

export async function getUserEvents(userId: string) {
    const events = await db
        .select()
        .from(eventsTable)
        .where(
            and(eq(eventsTable.user_id, userId), eq(eventsTable.deleted, false))
        );
    return events;
}

export async function deleteEvent(eventId: number) {
    const existingEvent = await db
        .select()
        .from(eventsTable)
        .where(eq(eventsTable.id, eventId));

    if (existingEvent.length === 0) {
        throw new Error("Event not found");
    }

    const result = await db
        .update(eventsTable)
        .set({ deleted: true })
        .where(eq(eventsTable.id, eventId))
        .returning();
    return result[0];
}

export async function getEventsByMonth(
    userId: string,
    year: number,
    month: number
) {
    const startOfMonth = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
    const endOfMonth = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

    const events = await db
        .select()
        .from(eventsTable)
        .where(
            and(
                eq(eventsTable.user_id, userId),
                lte(eventsTable.start, endOfMonth),
                gte(eventsTable.end, startOfMonth),
                eq(eventsTable.deleted, false)
            )
        )
        .orderBy(asc(eventsTable.start));

    return events;
}

export async function getEventsByDate(userId: string, date: Date) {
    // Ensure we're working with a Date object
    const queryDate = new Date(date);

    // Create UTC start of day (00:00:00) and end of day (23:59:59)
    const startOfDay = new Date(
        Date.UTC(
            queryDate.getFullYear(),
            queryDate.getMonth(),
            queryDate.getDate(),
            0,
            0,
            0,
            0
        )
    );

    const endOfDay = new Date(
        Date.UTC(
            queryDate.getFullYear(),
            queryDate.getMonth(),
            queryDate.getDate(),
            23,
            59,
            59,
            999
        )
    );

    // Find events that overlap with this UTC day
    const events = await db
        .select()
        .from(eventsTable)
        .where(
            and(
                eq(eventsTable.user_id, userId),
                lte(eventsTable.start, endOfDay), // Event starts before end of day
                gte(eventsTable.end, startOfDay), // Event ends after start of day
                eq(eventsTable.deleted, false) // Event is not deleted
            )
        );

    return events;
}
