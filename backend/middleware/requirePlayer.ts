import { createMiddleware } from "@hono/hono/factory";
import { HTTPException } from "@hono/hono/http-exception";
import type { AppEnv } from "../types.ts";
import { getPlayerById } from "../services/playerService.ts";

// Der Türsteher: läuft vor jeder Route unter /me
export const requirePlayer = createMiddleware<AppEnv>(async (c, next) => {
  // 1. Header auslesen
  const id = c.req.header("X-Player-Id");

  // 2. Kein Header? Abbruch mit 401
  if (id === undefined) {
    throw new HTTPException(401, { message: "Header X-Player-Id is missing" });
  }

  // 3. Spieler zu dieser id suchen
  const player = await getPlayerById(id);

  // 4. Keinen gefunden? Abbruch mit 401
  if (player === undefined) {
    throw new HTTPException(401, { message: "Unknown player" });
  }

  // 5. Spieler im Context ablegen, damit die Route ihn nutzen kann
  c.set("player", player);

  // 6. Weiter zur eigentlichen Route
  await next();
});