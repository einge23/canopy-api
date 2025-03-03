import { serve } from "@hono/node-server";
import { drizzle } from "drizzle-orm/node-postgres";
import { Hono } from "hono";
import "dotenv/config";
import userRoutes from "./routes/user-routes.js";
import eventRoutes from "./routes/event-routes.js";
import { logger } from "hono/logger";

const app = new Hono();

if (!process.env.DATABASE_PUBLIC_URL) {
    throw new Error("DATABASE_PUBLIC_URL is not set");
}

export const db = drizzle(process.env.DATABASE_PUBLIC_URL);

app.use("*", logger());

app.use("*", async (c, next) => {
    console.log(`[${new Date().toISOString()}] ${c.req.method} ${c.req.url}`);

    // Log request headers
    console.log("Headers:", c.req.header());

    await next();
});

app.route("/users", userRoutes);
app.route("/events", eventRoutes);

const port = 3000;
console.log(`Server is running`);

serve({
    fetch: app.fetch,
    port,
});
