import { Hono } from "hono";
import { eq, and, gte, lte, isNull, asc, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import {
  transactions,
  accounts,
  categories,
} from "@minhas-financas/database/schema";
import { newId } from "../utils/id";
import { encodeId, decodeId } from "../utils/hashid";
import { authMiddleware, type AuthEnv } from "../middleware/auth";
import { hashidMiddleware, type HashidVariables } from "../middleware/hashid";

type TxEnv = AuthEnv & { Variables: HashidVariables };

const txRoutes = new Hono<TxEnv>();

txRoutes.use("*", authMiddleware);

txRoutes.get("/", async (c) => {
  const userId = c.get("userId");
  const month = c.req.query("month");
  const year = c.req.query("year");
  const page = Math.max(1, parseInt(c.req.query("page") || "1", 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(c.req.query("limit") || "50", 10) || 50));
  const offset = (page - 1) * limit;

  const now = new Date();
  const m = month ? parseInt(month, 10) : now.getMonth() + 1;
  const y = year ? parseInt(year, 10) : now.getFullYear();

  const startDate = `${y}-${String(m).padStart(2, "0")}-01`;
  const lastDay = new Date(y, m, 0).getDate();
  const endDate = `${y}-${String(m).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  const db = drizzle(c.env.DB);
  const salt = c.env.HASHIDS_SALT;

  const whereCondition = and(
    eq(transactions.userId, userId),
    gte(transactions.dueDate, startDate),
    lte(transactions.dueDate, endDate),
    isNull(transactions.deletedAt)
  );

  const summaryRows = await db
    .select({
      type: transactions.type,
      total: sql<number>`cast(sum(${transactions.amount}) as integer)`,
    })
    .from(transactions)
    .where(whereCondition)
    .groupBy(transactions.type);

  let income = 0;
  let expense = 0;
  for (const row of summaryRows) {
    if (row.type === "income") income += row.total;
    else if (row.type === "expense") expense += Math.abs(row.total);
  }

  const countResult = await db
    .select({ count: sql<number>`cast(count(*) as integer)` })
    .from(transactions)
    .where(whereCondition);

  const total = countResult[0]?.count ?? 0;

  const rows = await db
    .select({
      id: transactions.id,
      description: transactions.description,
      amount: transactions.amount,
      date: transactions.date,
      dueDate: transactions.dueDate,
      type: transactions.type,
      isPaid: transactions.isPaid,
      accountId: transactions.accountId,
      categoryId: transactions.categoryId,
      accountName: accounts.name,
      categoryName: categories.name,
      categoryColor: categories.color,
    })
    .from(transactions)
    .leftJoin(accounts, eq(transactions.accountId, accounts.id))
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .where(whereCondition)
    .orderBy(asc(transactions.dueDate))
    .limit(limit)
    .offset(offset);

  const items = rows.map((row) => ({
    id: encodeId(row.id, salt),
    description: row.description,
    amount: row.amount,
    date: row.date,
    dueDate: row.dueDate,
    type: row.type,
    isPaid: row.isPaid,
    accountId: encodeId(row.accountId, salt),
    categoryId: encodeId(row.categoryId, salt),
    accountName: row.accountName,
    categoryName: row.categoryName,
    categoryColor: row.categoryColor,
  }));

  return c.json({
    summary: {
      income,
      expense,
      balance: income - expense,
    },
    items,
    pagination: {
      page,
      limit,
      total,
      hasMore: page * limit < total,
    },
  });
});

txRoutes.post("/", async (c) => {
  const userId = c.get("userId");
  const salt = c.env.HASHIDS_SALT;

  const body = await c.req.json<{
    description: string;
    amount: number;
    date: string;
    dueDate: string;
    type: string;
    accountId: string;
    categoryId: string;
  }>();

  if (!body.description || !body.amount || !body.dueDate || !body.type || !body.accountId || !body.categoryId) {
    return c.json({ error: "errors.missing_fields" }, 400);
  }

  const decodedAccountId = decodeId(body.accountId, salt);
  const decodedCategoryId = decodeId(body.categoryId, salt);

  if (!decodedAccountId || !decodedCategoryId) {
    return c.json({ error: "errors.invalid_id" }, 400);
  }

  const db = drizzle(c.env.DB);
  const id = newId();
  const now = new Date();

  const amount = body.type === "expense" ? -Math.abs(body.amount) : Math.abs(body.amount);

  await db.insert(transactions).values({
    id,
    userId,
    accountId: decodedAccountId,
    categoryId: decodedCategoryId,
    description: body.description,
    amount,
    date: body.date || now.toISOString().split("T")[0],
    dueDate: body.dueDate,
    type: body.type as "income" | "expense" | "transfer",
    isPaid: false,
    createdAt: now,
    updatedAt: now,
  });

  return c.json(
    {
      transaction: {
        id: encodeId(id, salt),
        description: body.description,
        amount,
        date: body.date || now.toISOString().split("T")[0],
        dueDate: body.dueDate,
        type: body.type,
        isPaid: false,
        accountId: body.accountId,
        categoryId: body.categoryId,
        accountName: "",
        categoryName: "",
        categoryColor: "",
      },
    },
    201
  );
});

txRoutes.patch("/:id/toggle-paid", hashidMiddleware, async (c) => {
  const userId = c.get("userId");
  const decodedId = c.get("decodedId");

  if (!decodedId) {
    return c.json({ error: "errors.invalid_id" }, 400);
  }

  const db = drizzle(c.env.DB);
  const txId = decodedId;

  const tx = await db
    .select()
    .from(transactions)
    .where(
      and(
        eq(transactions.id, txId),
        eq(transactions.userId, userId),
        isNull(transactions.deletedAt)
      )
    )
    .get();

  if (!tx) {
    return c.json({ error: "errors.transaction_not_found" }, 404);
  }

  const newIsPaid = !tx.isPaid;
  await db
    .update(transactions)
    .set({ isPaid: newIsPaid, updatedAt: new Date() })
    .where(eq(transactions.id, txId));

  return c.json({ isPaid: newIsPaid });
});

export default txRoutes;