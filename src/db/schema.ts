import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import {
    boolean,
    date,
    integer,
    pgTable,
    timestamp,
    varchar,
} from "drizzle-orm/pg-core";
export const usersTable = pgTable("users", {
    id: varchar({ length: 255 }).primaryKey(),
    username: varchar({ length: 255 }).notNull(),
    email: varchar({ length: 255 }).notNull().unique(),
    password: varchar({ length: 255 }).notNull(),
});

export type User = InferSelectModel<typeof usersTable>;

export type NewUser = InferInsertModel<typeof usersTable>;

export type UserDTO = Omit<User, "password">;

export const eventsTable = pgTable("events", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    name: varchar({ length: 255 }).notNull(),
    start: timestamp({ withTimezone: true }).notNull(),
    end: timestamp({ withTimezone: true }).notNull(),
    location: varchar({ length: 255 }).notNull(),
    description: varchar({ length: 255 }).notNull(),
    user_id: varchar({ length: 255 })
        .notNull()
        .references(() => usersTable.id, { onDelete: "cascade" }),
    color: varchar({ length: 8 }).notNull(),
    recurrence_rule: varchar({ length: 255 }),
    deleted: boolean().notNull().default(false),
});

export type Event = InferSelectModel<typeof eventsTable>;

export type NewEvent = InferInsertModel<typeof eventsTable>;

export type EventDTO = Omit<Event, "deleted">;
