//// filepath: /C:/Users/einge/source/repos/canopy/canopy-api/src/routes/user-routes.ts
import { Hono } from "hono";
import { getUserById, createUser } from "../services/user-services.js";
import type { UserDTO } from "../db/schema.js";
import type { CreateUserRequest } from "../types/create-user-request.js";

const userRoutes = new Hono();

userRoutes.get("/:id", async (c) => {
    const id = Number(c.req.param("id"));
    const user = await getUserById(id);

    if (!user) return c.json({ error: "User not found" }, 404);

    const safeUser: UserDTO = (({ password, ...rest }) => rest)(user);

    return c.json(safeUser);
});

userRoutes.post("/create", async (c) => {
    try {
        const payload = (await c.req.json()) as CreateUserRequest;
        const { username, email, password } = payload;

        if (!username || !email || !password) {
            return c.json({ error: "Missing required fields" }, 400);
        }

        const newUser = await createUser(username, email, password);
        const safeUser: UserDTO = (({ password, ...rest }) => rest)(newUser);

        return c.json(safeUser, 201);
    } catch (error) {
        return c.json({ error: "Could not create user" }, 500);
    }
});

export default userRoutes;
