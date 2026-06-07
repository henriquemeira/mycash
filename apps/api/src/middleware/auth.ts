import { createMiddleware } from "hono/factory";
import { getCookie } from "hono/cookie";
import { verifyJwt } from "../utils/jwt";
import type { Env } from "../env";

export type AuthEnv = {
  Variables: {
    userId: string;
    userEmail: string;
  };
  Bindings: Env;
};

export const authMiddleware = createMiddleware<AuthEnv>(async (c, next) => {
  const token = getCookie(c, "token");

  if (!token) {
    return c.json({ error: "Não autenticado" }, 401);
  }

  const payload = await verifyJwt(token, c.env.JWT_SECRET);

  if (!payload) {
    return c.json({ error: "Token inválido ou expirado" }, 401);
  }

  c.set("userId", payload.sub);
  c.set("userEmail", payload.email);

  await next();
});
