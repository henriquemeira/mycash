import { Hono } from "hono";
import { eq, and, isNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { categories } from "@mycash/database/schema";
import { newId } from "../utils/id";
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

categoryRoutes.post("/", async (c) => {
  const userId = c.get("userId");
  const db = drizzle(c.env.DB);
  const salt = c.env.HASHIDS_SALT;
  const body = await c.req.json();
  const now = new Date();
  const id = newId();

  await db.insert(categories).values({
    id,
    userId,
    name: body.name,
    type: body.type,
    color: body.color || "#6b7280",
    icon: body.icon || "tag",
    createdAt: now,
    updatedAt: now,
  });

  return c.json({
    category: {
      id: encodeId(id, salt),
      name: body.name,
      type: body.type,
      color: body.color || "#6b7280",
      icon: body.icon || "tag",
    },
  });
});

export default categoryRoutes;
