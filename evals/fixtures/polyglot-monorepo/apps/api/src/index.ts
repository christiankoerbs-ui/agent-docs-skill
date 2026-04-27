import { Hono } from "hono";
import { clamp } from "@fixture/utils";

const app = new Hono();

app.get("/health", (c) => c.json({ status: "ok" }));

app.get("/clamp/:n", (c) => {
  const n = Number(c.req.param("n"));
  return c.json({ value: clamp(n, 0, 100) });
});

export default app;
