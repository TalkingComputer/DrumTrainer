import { Hono } from "@hono/hono";
import { HTTPException } from "@hono/hono/http-exception";
import type { AppEnv, PlayedRudiment, SessionInput } from "../types.ts";
import { readBody } from "../utils/readBody.ts";
import { createSession, deleteSession, getSessionsOfPlayer } from "../services/sessionService.ts";

const sessions = new Hono<AppEnv>();

// Hilfsfunktion: Ist der Wert eine ganze Zahl größer 0?
function isPositiveInteger(value: any): boolean {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}

// Prüft die Form des Bodys und baut daraus ein sauberes SessionInput
function checkSessionBody(body: any): SessionInput {
  if (body === null || typeof body !== "object") {
    throw new HTTPException(400, { message: "Body muss ein JSON-Objekt sein" });
  }

  if (typeof body.date !== "string" || isNaN(Date.parse(body.date))) {
    throw new HTTPException(400, { message: "Feld 'date' muss ein gültiges Datum sein" });
  }

  if (!isPositiveInteger(body.durationSeconds)) {
    throw new HTTPException(400, { message: "Feld 'durationSeconds' muss eine ganze Zahl größer 0 sein" });
  }

  if (!Array.isArray(body.playedRudiments) || body.playedRudiments.length === 0) {
    throw new HTTPException(400, { message: "Feld 'playedRudiments' muss mindestens einen Eintrag enthalten" });
  }

  const playedRudiments: PlayedRudiment[] = [];

  for (const entry of body.playedRudiments) {
    if (entry === null || typeof entry !== "object") {
      throw new HTTPException(400, { message: "Jeder Eintrag in 'playedRudiments' muss ein Objekt sein" });
    }
    if (typeof entry.rudimentId !== "string") {
      throw new HTTPException(400, { message: "Feld 'rudimentId' fehlt oder ist kein Text" });
    }
    if (!isPositiveInteger(entry.bpm)) {
      throw new HTTPException(400, { message: "Feld 'bpm' muss eine ganze Zahl größer 0 sein" });
    }
    if (!isPositiveInteger(entry.durationSeconds)) {
      throw new HTTPException(400, { message: "Feld 'durationSeconds' im Rudiment muss eine ganze Zahl größer 0 sein" });
    }

    // Nur die erlaubten Felder übernehmen
    playedRudiments.push({
      rudimentId: entry.rudimentId,
      bpm: entry.bpm,
      durationSeconds: entry.durationSeconds,
    });
  }

  return {
    date: body.date,
    durationSeconds: body.durationSeconds,
    playedRudiments: playedRudiments,
  };
}

// GET /api/players/me/sessions
sessions.get("/", async (c) => {
  const player = c.get("player");
  const playerSessions = await getSessionsOfPlayer(player);
  return c.json(playerSessions);
});

// POST /api/players/me/sessions
sessions.post("/", async (c) => {
  const player = c.get("player");
  const body = await readBody(c.req.raw);
  const input = checkSessionBody(body);
  const newSession = await createSession(player, input);
  return c.json(newSession, 201);
});

// DELETE /api/players/me/sessions/:sessionId
sessions.delete("/:sessionId", async (c) => {
  const player = c.get("player");
  const sessionId = c.req.param("sessionId");
  await deleteSession(player, sessionId);
  return c.body(null, 204);
});

export default sessions;