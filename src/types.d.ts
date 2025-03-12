import type { Session } from "@clerk/backend";
import { ContextVariables } from "hono";

declare module "hono" {
  interface ContextVariables {
    sessionId: string;
    session: Session;
  }
}
