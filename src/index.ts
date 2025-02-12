import { serve } from "@hono/node-server";
import { drizzle } from "drizzle-orm/node-postgres";
import { Hono } from "hono";
import "dotenv/config";
import userRoutes from "./routes/user-routes.js";

const app = new Hono();

if (!process.env.DATABASE_PUBLIC_URL) {
    throw new Error("DATABASE_PUBLIC_URL is not set");
}

export const db = drizzle(process.env.DATABASE_PUBLIC_URL);

app.route("/users", userRoutes);

const port = 3000;
console.log(`Server is running`);

serve({
    fetch: app.fetch,
    port,
});
