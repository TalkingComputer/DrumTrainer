import type { Session } from "../types.ts";
import { readDb, writeDb } from "./db.ts";

// Alle Sessions eines Spielers
export async function findSessionsByPlayerId(playerId: string): Promise<Session[]> {
  const db = await readDb();
  const result: Session[] = [];

  for (const session of db.sessions) {
    if (session.playerId === playerId) {
      result.push(session);
    }
  }

  return result;
}

// Eine einzelne Session anhand ihrer id
export async function findSessionById(sessionId: string): Promise<Session | undefined> {
  const db = await readDb();

  for (const session of db.sessions) {
    if (session.id === sessionId) {
      return session;
    }
  }

  return undefined;
}

// Neue Session speichern
export async function insertSession(newSession: Session): Promise<void> {
  const db = await readDb();
  db.sessions.push(newSession);
  await writeDb(db);
}

// Bestehende Session ersetzen (gleiche id) und speichern
export async function updateSessionRecord(changedSession: Session): Promise<void> {
  const db = await readDb();

  for (let i = 0; i < db.sessions.length; i++) {
    if (db.sessions[i].id === changedSession.id) {
      db.sessions[i] = changedSession;
    }
  }

  await writeDb(db);
}

// Session löschen: alle Sessions außer der gesuchten behalten
export async function deleteSessionById(sessionId: string): Promise<void> {
  const db = await readDb();
  const remaining: Session[] = [];

  for (const session of db.sessions) {
    if (session.id !== sessionId) {
      remaining.push(session);
    }
  }

  db.sessions = remaining;
  await writeDb(db);
}