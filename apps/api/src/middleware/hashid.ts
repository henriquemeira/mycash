import { createMiddleware } from "hono/factory";
import { encodeId, decodeId } from "../utils/hashid";

export const hashidMiddleware = createMiddleware(async (c, next) => {
  const salt = c.env.HASHIDS_SALT;

  const idParam = c.req.param("id");
  if (idParam) {
    const decoded = decodeId(idParam, salt);
    if (decoded === null) {
      return c.json({ error: "errors.invalid_id" }, 400);
    }
    c.req.raw.headers.set("x-decoded-id", decoded.toString());
  }

  await next();
});

export function encodeResponseIds(data: unknown, salt: string): unknown {
  if (data === null || data === undefined) return data;

  if (Array.isArray(data)) {
    return data.map((item) => encodeResponseIds(item, salt));
  }

  if (typeof data === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      if (
        (key === "id" || key.endsWith("_id") || key.endsWith("Id")) &&
        typeof value === "bigint"
      ) {
        result[key] = encodeId(value, salt);
      } else {
        result[key] = encodeResponseIds(value, salt);
      }
    }
    return result;
  }

  return data;
}
