import { createClerkClient, verifyToken } from "@clerk/backend";
import { createMiddleware } from "hono/factory";

const clerk = createClerkClient({
    secretKey: process.env.CLERK_SECRET_KEY,
    publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
});

export const clerkAuth = createMiddleware(async (c, next) => {
    try {
        const authHeader = c.req.header("Authorization");

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return c.json(
                {
                    error: "Unauthorized: Missing or invalid authorization header",
                },
                401
            );
        }
        const { isSignedIn } = await clerk.authenticateRequest(c.req.raw);

        if (!isSignedIn) {
            return c.json({ error: "Unauthorized: not signed in" }, 401);
        }

        console.log("clerk auth completed");
        await next();
    } catch (error) {
        console.log(error);
        return c.json({ error: "Unauthorized: Invalid token" }, 401);
    }
});
