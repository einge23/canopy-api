import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { integer, pgTable, varchar } from "drizzle-orm/pg-core";
export const usersTable = pgTable("users", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    username: varchar({ length: 255 }).notNull(),
    email: varchar({ length: 255 }).notNull().unique(),
    password: varchar({ length: 255 }).notNull(),
});

export type User = InferSelectModel<typeof usersTable>;

export type NewUser = InferInsertModel<typeof usersTable>;

export type UserDTO = Omit<User, "password">;
