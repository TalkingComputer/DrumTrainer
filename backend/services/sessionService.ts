import { HTTPException } from "@hono/hono/http-exception";
import type { Player, Session, SessionInput } from "../types.ts";
import { getRudimentById } from "./rudimentService.ts";
import {
  deleteSessionById,
  findSessionById,
  findSessionsByPlayerId,
  insertSession,
  updateSessionRecord,
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
      throw new HTTPException(400, { message: "Unknown rudiment: " + played.rudimentId });
    }

    // Regel 2: BPM im sinnvollen Bereich
    if (played.bpm < MIN_BPM || played.bpm > MAX_BPM) {
      throw new HTTPException(400, {
        message: "BPM must be between " + MIN_BPM + " and " + MAX_BPM,
      });
    }

    sumOfDurations = sumOfDurations + played.durationSeconds;
  }

  // Regel 3: Teildauern zusammen nicht länger als die ganze Session
  if (sumOfDurations > input.durationSeconds) {
    throw new HTTPException(400, {
      message: "The rudiments together last longer than the session",
    });
  }

  // Regel 4: Keine Sessions in der Zukunft
  const sessionDate = new Date(input.date);
  const now = new Date();
  if (sessionDate > now) {
    throw new HTTPException(400, { message: "The date is in the future" });
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

// Eine einzelne Session holen, aber nur die eigene.
// Abrufen, Ändern und Löschen nutzen diese Funktion für den Besitz-Check.
export async function getOwnSession(player: Player, sessionId: string): Promise<Session> {
  const session = await findSessionById(sessionId);

  // Gibt es die Session nicht oder gehört sie jemand anderem: 404.
  // Beide Fälle sehen gleich aus. So verrät die API nicht,
  // ob eine fremde Session mit dieser id existiert.
  if (session === undefined || session.playerId !== player.id) {
    throw new HTTPException(404, { message: "Session not found" });
  }

  return session;
}

// Bestehende Session ändern. Es gelten dieselben Regeln wie beim Anlegen.
// id und playerId bleiben, alles andere kommt aus der Eingabe.
export async function updateSession(
  player: Player,
  sessionId: string,
  input: SessionInput,
): Promise<Session> {
  const existing = await getOwnSession(player, sessionId);
  checkSessionRules(input);

  const changedSession: Session = {
    id: existing.id,
    playerId: existing.playerId,
    date: new Date(input.date).toISOString(),
    durationSeconds: input.durationSeconds,
    playedRudiments: input.playedRudiments,
  };

  await updateSessionRecord(changedSession);
  return changedSession;
}

// Session löschen, aber nur die eigene
export async function deleteSession(player: Player, sessionId: string): Promise<void> {
  await getOwnSession(player, sessionId);
  await deleteSessionById(sessionId);
}