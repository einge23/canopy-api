import { db } from "../index.js";
import { usersTable } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { hashPassword } from "../util/password-hash.js";

export async function getUserById(id: number) {
    const [user] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.id, id));
    return user;
}

export async function createUser(
    username: string,
    email: string,
    password: string
) {
    const hashedPassword = await hashPassword(password);
    const result = await db
        .insert(usersTable)
        .values({ username, email, password: hashedPassword })
        .returning();
    return result[0];
}
