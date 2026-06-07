import { Hono } from "hono";
import { eq, and, isNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { accounts } from "@minhas-financas/database/schema";
import { encodeId } from "../utils/hashid";
import { authMiddleware, type AuthEnv } from "../middleware/auth";

const accountRoutes = new Hono<AuthEnv>();

accountRoutes.use("*", authMiddleware);

accountRoutes.get("/", async (c) => {
  const userId = c.get("userId");
  const db = drizzle(c.env.DB);
  const salt = c.env.HASHIDS_SALT;

  const rows = await db
    .select()
    .from(accounts)
    .where(and(eq(accounts.userId, userId), isNull(accounts.deletedAt)));

  const items = rows.map((row) => ({
    id: encodeId(row.id, salt),
    name: row.name,
    type: row.type,
    color: row.color,
    currency: row.currency,
  }));

  return c.json({ items });
});

export default accountRoutes;
