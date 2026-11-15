import { Hono } from "@hono/hono";
import { HTTPException } from "@hono/hono/http-exception";
import type { AppEnv } from "../types.ts";
import { requirePlayer } from "../middleware/requirePlayer.ts";
import { createPlayer, renamePlayer } from "../services/playerService.ts";

const players = new Hono<AppEnv>();

// Prüft den Namen aus dem Body und gibt ihn bereinigt zurück.
// Bei ungültigem Namen bricht die Funktion mit 400 ab.
// "any" heißt: TypeScript prüft hier nichts, wir prüfen selbst.
function checkName(body: any): string {
  if (body === null || typeof body !== "object") {
    throw new HTTPException(400, { message: "Body muss ein JSON-Objekt sein" });
  }

  if (typeof body.name !== "string") {
    throw new HTTPException(400, { message: "Feld 'name' fehlt oder ist kein Text" });
  }

  const name = body.name.trim();

  if (name.length < 1) {
    throw new HTTPException(400, { message: "Name darf nicht leer sein" });
  }

  if (name.length > 30) {
    throw new HTTPException(400, { message: "Name darf höchstens 30 Zeichen lang sein" });
  }

  return name;
}

// Liest den JSON-Body. Bei kaputtem JSON Abbruch mit 400.
async function readBody(request: Request): Promise<any> {
  try {
    const body = await request.json();
    return body;
  } catch {
    throw new HTTPException(400, { message: "Ungültiges JSON" });
  }
}

// POST /api/players → neuen Spieler anlegen (ohne Header)
players.post("/", async (c) => {
  const body = await readBody(c.req.raw);
  const name = checkName(body);
  const newPlayer = await createPlayer(name);
  return c.json(newPlayer, 201);
});

// Ab hier läuft vor jeder Route der Türsteher
players.use("/me", requirePlayer);
players.use("/me/*", requirePlayer);

// GET /api/players/me → eigenes Profil
players.get("/me", (c) => {
  const player = c.get("player");
  return c.json(player);
});

// PATCH /api/players/me → Namen ändern
players.patch("/me", async (c) => {
  const body = await readBody(c.req.raw);
  const name = checkName(body);
  const player = c.get("player");
  const changedPlayer = await renamePlayer(player, name);
  return c.json(changedPlayer);
});

export default players;