import { eventsTable } from "../db/schema.js";
import { db } from "../index.js";
import { and, or, eq, gte, lte } from "drizzle-orm";
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

    // Query to filter events within the day
    const events = await db
        .select()
        .from(eventsTable)
        .where(
            and(
                eq(eventsTable.user_id, userId),
                gte(eventsTable.start, startOfDay),
                lte(eventsTable.start, endOfDay)
            )
        );

    return events;
}
