import { serve } from "@hono/node-server";
import { drizzle } from "drizzle-orm/node-postgres";
import { Hono } from "hono";
import "dotenv/config";

const app = new Hono();

if (!process.env.DATABASE_PUBLIC_URL) {
    throw new Error("DATABASE_PUBLIC_URL is not set");
}

const db = drizzle(process.env.DATABASE_PUBLIC_URL);

const test = db.select();
console.log(test);

app.get("/", (c) => {
    return c.text("Hello Hono!");
});

const port = 3000;
console.log(`Server is running on http://localhost:${port}`);

serve({
    fetch: app.fetch,
    port,
});
