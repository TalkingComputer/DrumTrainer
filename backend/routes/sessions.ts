import { Hono } from "@hono/hono";
import { HTTPException } from "@hono/hono/http-exception";
import type { AppEnv, PlayedRudiment, SessionInput } from "../types.ts";
import { readBody } from "../utils/readBody.ts";
import {
  createSession,
  deleteSession,
  getOwnSession,
  getSessionsOfPlayer,
  updateSession,
} from "../services/sessionService.ts";

const sessions = new Hono<AppEnv>();

// Hilfsfunktion: Ist der Wert eine ganze Zahl größer 0?
function isPositiveInteger(value: any): boolean {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}

// Prüft die Form des Bodys und baut daraus ein sauberes SessionInput
function checkSessionBody(body: any): SessionInput {
  if (body === null || typeof body !== "object") {
    throw new HTTPException(400, { message: "Body must be a JSON object" });
  }

  if (typeof body.date !== "string" || isNaN(Date.parse(body.date))) {
    throw new HTTPException(400, { message: "Field 'date' must be a valid date" });
  }

  if (!isPositiveInteger(body.durationSeconds)) {
    throw new HTTPException(400, { message: "Field 'durationSeconds' must be a whole number greater than 0" });
  }

  if (!Array.isArray(body.playedRudiments) || body.playedRudiments.length === 0) {
    throw new HTTPException(400, { message: "Field 'playedRudiments' must contain at least one entry" });
  }

  const playedRudiments: PlayedRudiment[] = [];

  for (const entry of body.playedRudiments) {
    if (entry === null || typeof entry !== "object") {
      throw new HTTPException(400, { message: "Every entry in 'playedRudiments' must be an object" });
    }
    if (typeof entry.rudimentId !== "string") {
      throw new HTTPException(400, { message: "Field 'rudimentId' is missing or not a string" });
    }
    if (!isPositiveInteger(entry.bpm)) {
      throw new HTTPException(400, { message: "Field 'bpm' must be a whole number greater than 0" });
    }
    if (!isPositiveInteger(entry.durationSeconds)) {
      throw new HTTPException(400, { message: "Field 'durationSeconds' of a rudiment must be a whole number greater than 0" });
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

// GET /api/players/me/sessions/:sessionId → eine einzelne Session (z. B. zum Bearbeiten)
sessions.get("/:sessionId", async (c) => {
  const player = c.get("player");
  const sessionId = c.req.param("sessionId");
  const session = await getOwnSession(player, sessionId);
  return c.json(session);
});

// PATCH /api/players/me/sessions/:sessionId → Session korrigieren.
// Erwartet denselben Body wie POST, also die komplette Session.
sessions.patch("/:sessionId", async (c) => {
  const player = c.get("player");
  const sessionId = c.req.param("sessionId");
  const body = await readBody(c.req.raw);
  const input = checkSessionBody(body);
  const changedSession = await updateSession(player, sessionId, input);
  return c.json(changedSession);
});

// DELETE /api/players/me/sessions/:sessionId
sessions.delete("/:sessionId", async (c) => {
  const player = c.get("player");
  const sessionId = c.req.param("sessionId");
  await deleteSession(player, sessionId);
  return c.body(null, 204);
});

export default sessions;