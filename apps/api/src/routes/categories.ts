import { Hono } from "hono";
import { eq, and, isNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { categories } from "@mycash/database/schema";
import { encodeId } from "../utils/hashid";
import { authMiddleware, type AuthEnv } from "../middleware/auth";

const categoryRoutes = new Hono<AuthEnv>();

categoryRoutes.use("*", authMiddleware);

categoryRoutes.get("/", async (c) => {
  const userId = c.get("userId");
  const db = drizzle(c.env.DB);
  const salt = c.env.HASHIDS_SALT;

  const rows = await db
    .select()
    .from(categories)
    .where(and(eq(categories.userId, userId), isNull(categories.deletedAt)));

  const items = rows.map((row) => ({
    id: encodeId(row.id, salt),
    name: row.name,
    type: row.type,
    color: row.color,
    icon: row.icon,
  }));

  return c.json({ items });
});

export default categoryRoutes;
