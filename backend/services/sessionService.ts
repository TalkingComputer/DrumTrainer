import { HTTPException } from "@hono/hono/http-exception";
import type { Player, Session, SessionInput } from "../types.ts";
import { getRudimentById } from "./rudimentService.ts";
import {
  deleteSessionById,
  findSessionById,
  findSessionsByPlayerId,
  insertSession,
} from "../repositories/sessionRepository.ts";

const MIN_BPM = 20;
const MAX_BPM = 400;

// Prüft alle Geschäftsregeln. Bei einem Verstoß Abbruch mit 400.
function checkSessionRules(input: SessionInput): void {
  let sumOfDurations = 0;

  for (const played of input.playedRudiments) {
    // Regel 1: Das Rudiment muss existieren
    const rudiment = getRudimentById(played.rudimentId);
    if (rudiment === undefined) {
      throw new HTTPException(400, { message: "Unbekanntes Rudiment: " + played.rudimentId });
    }

    // Regel 2: BPM im sinnvollen Bereich
    if (played.bpm < MIN_BPM || played.bpm > MAX_BPM) {
      throw new HTTPException(400, {
        message: "BPM muss zwischen " + MIN_BPM + " und " + MAX_BPM + " liegen",
      });
    }

    sumOfDurations = sumOfDurations + played.durationSeconds;
  }

  // Regel 3: Teildauern zusammen nicht länger als die ganze Session
  if (sumOfDurations > input.durationSeconds) {
    throw new HTTPException(400, {
      message: "Die Rudimente dauern zusammen länger als die Session",
    });
  }

  // Regel 4: Keine Sessions in der Zukunft
  const sessionDate = new Date(input.date);
  const now = new Date();
  if (sessionDate > now) {
    throw new HTTPException(400, { message: "Das Datum liegt in der Zukunft" });
  }
}

// Alle Sessions des Spielers, neueste zuerst
export async function getSessionsOfPlayer(player: Player): Promise<Session[]> {
  const sessions = await findSessionsByPlayerId(player.id);

  // ISO-Datumstexte lassen sich direkt als Text vergleichen
  sessions.sort(function (a, b) {
    return b.date.localeCompare(a.date);
  });

  return sessions;
}

// Neue Session anlegen
export async function createSession(player: Player, input: SessionInput): Promise<Session> {
  checkSessionRules(input);

  const newSession: Session = {
    id: crypto.randomUUID(),
    playerId: player.id,
    date: new Date(input.date).toISOString(),
    durationSeconds: input.durationSeconds,
    playedRudiments: input.playedRudiments,
  };

  await insertSession(newSession);
  return newSession;
}

// Session löschen, aber nur die eigene
export async function deleteSession(player: Player, sessionId: string): Promise<void> {
  const session = await findSessionById(sessionId);

  // Gibt es die Session nicht oder gehört sie jemand anderem: 404.
  // Beide Fälle sehen gleich aus. So verrät die API nicht,
  // ob eine fremde Session mit dieser id existiert.
  if (session === undefined || session.playerId !== player.id) {
    throw new HTTPException(404, { message: "Session nicht gefunden" });
  }

  await deleteSessionById(sessionId);
}