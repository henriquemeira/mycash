import { Hono } from "hono";
import { cors } from "hono/cors";
import auth from "./routes/auth";
import transactions from "./routes/transactions";
import accounts from "./routes/accounts";
import categories from "./routes/categories";
import type { Env } from "./env";

const app = new Hono<{ Bindings: Env }>();

app.use(
  "*",
  cors({
    origin: ["http://localhost:5173"],
    credentials: true,
  })
);

app.get("/health", (c) => c.json({ status: "ok", timestamp: new Date().toISOString() }));

app.route("/auth", auth);
app.route("/transactions", transactions);
app.route("/accounts", accounts);
app.route("/categories", categories);

export default app;
