import { Hono } from "@hono/hono";
import { cors } from "@hono/hono/cors";
import { HTTPException } from "@hono/hono/http-exception";
import health from "./routes/health.ts";
import players from "./routes/players.ts";

const app = new Hono();

app.use(
  "/api/*",
  cors({
    origin: "http://localhost:5173",
    allowHeaders: ["Content-Type", "X-Player-Id"],
  }),
);

app.route("/api/health", health);
app.route("/api/players", players);

// Einheitliches Fehlerformat für alle Routen
app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return c.json({ error: err.message }, err.status);
  }
  console.error(err);
  return c.json({ error: "Interner Serverfehler" }, 500);
});

app.notFound((c) => c.json({ error: "Route nicht gefunden" }, 404));

Deno.serve({ port: 8000 }, app.fetch);