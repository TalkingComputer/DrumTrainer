import { Hono } from "@hono/hono";
import { cors } from "@hono/hono/cors";
import health from "./routes/health.ts";

const app = new Hono();

app.use("/api/*", cors({ origin: "http://localhost:5173" }));

app.route("/api/health", health);

Deno.serve({ port: 8000 }, app.fetch);