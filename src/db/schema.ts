import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import {
    boolean,
    date,
    integer,
    pgTable,
    timestamp,
    varchar,
} from "drizzle-orm/pg-core";

export const eventsTable = pgTable("events", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    name: varchar({ length: 255 }).notNull(),
    start: timestamp({ withTimezone: true }).notNull(),
    end: timestamp({ withTimezone: true }).notNull(),
    location: varchar({ length: 255 }).notNull(),
    description: varchar({ length: 255 }).notNull(),
    user_id: varchar({ length: 255 }).notNull(),
    color: varchar({ length: 8 }).notNull(),
    recurrence_rule: varchar({ length: 255 }),
    deleted: boolean().notNull().default(false),
});

export type Event = InferSelectModel<typeof eventsTable>;

export type NewEvent = InferInsertModel<typeof eventsTable>;

export type EventDTO = Omit<Event, "deleted">;

export type SerializedEventDTO = Omit<EventDTO, "start" | "end"> & {
    start: string;
    end: string;
};

// Helper functions
export function serializeEvent(event: EventDTO): SerializedEventDTO {
    return {
        ...event,
        start: event.start.toISOString(),
        end: event.end.toISOString(),
    };
}

export function deserializeEvent(event: SerializedEventDTO): EventDTO {
    return {
        ...event,
        start: new Date(event.start),
        end: new Date(event.end),
    };
}
