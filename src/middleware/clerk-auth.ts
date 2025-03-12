import { createClerkClient, verifyToken } from "@clerk/backend";
import type { Session } from "@clerk/backend";
import { createMiddleware } from "hono/factory";

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

export const clerkAuth = createMiddleware<{
  Variables: {
    sessionId: string;
    session: Session;
  };
}>(async (c, next) => {
  try {
    const authHeader = c.req.header("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return c.json(
        { error: "Unauthorized: Missing or invalid authorization header" },
        401
      );
    }
    const token = authHeader.replace("Bearer ", "");

    const verifiedToken = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY,
    });

    console.log(verifiedToken);

    const sessionId = verifiedToken.sid;
    const session = await clerk.sessions.getSession(sessionId);

    c.set("sessionId", sessionId);
    c.set("session", session);

    console.log("clerk auth completed");
    await next();
  } catch (error) {
    return c.json({ error: "Unauthorized: Invalid token" }, 401);
  }
});
