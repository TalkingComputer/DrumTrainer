import { Hono } from "@hono/hono";
import { cors } from "@hono/hono/cors";
import { HTTPException } from "@hono/hono/http-exception";
import health from "./routes/health.ts";
import players from "./routes/players.ts";
import rudiments from "./routes/rudiments.ts";
import { validateRudiments } from "./services/rudimentService.ts";

// Vor dem Start: Startliste der Rudimente prüfen.
// Ein kaputtes Pattern soll sofort auffallen, nicht erst im Browser.
const rudimentErrors = validateRudiments();
if (rudimentErrors.length > 0) {
  console.error("Fehler in backend/seed/rudiments.json:");
  for (const error of rudimentErrors) {
    console.error("  - " + error);
  }
  Deno.exit(1);
}

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
app.route("/api/rudiments", rudiments);

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