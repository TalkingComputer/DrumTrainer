import { HTTPException } from "@hono/hono/http-exception";
import type { LeaderboardEntry, LeaderboardQuery, Period, Player, Session } from "../types.ts";
import { getPlayerById } from "./playerService.ts";
import { getFriendIds } from "./friendService.ts";
import { getSessionsOfPlayer } from "./sessionService.ts";
import { getRudimentById } from "./rudimentService.ts";

// Ab welchem Datum zählen Sessions? undefined heißt: alle.
function getStartDate(period: Period): Date | undefined {
  const now = new Date();

  if (period === "week") {
    const start = new Date(now);
    start.setDate(start.getDate() - 7);
    return start;
  }

  if (period === "month") {
    const start = new Date(now);
    start.setDate(start.getDate() - 30);
    return start;
  }

  return undefined;
}

// Liegt die Session im gewählten Zeitraum?
function isInPeriod(session: Session, startDate: Date | undefined): boolean {
  if (startDate === undefined) {
    return true;
  }
  const sessionDate = new Date(session.date);
  return sessionDate >= startDate;
}

// Berechnet den Wert eines Spielers aus seinen Sessions
function calculateValue(
  sessions: Session[],
  query: LeaderboardQuery,
  startDate: Date | undefined,
): number {
  let value = 0;

  for (const session of sessions) {
    if (!isInPeriod(session, startDate)) {
      // Session liegt außerhalb des Zeitraums, überspringen
      continue;
    }

    // Fall 1: Gesamte Übezeit ohne Rudiment-Filter
    if (query.metric === "duration" && query.rudimentId === undefined) {
      value = value + session.durationSeconds;
      continue;
    }

    // Fall 2 und 3: Nur die Abschnitte mit dem gewählten Rudiment
    for (const played of session.playedRudiments) {
      if (played.rudimentId !== query.rudimentId) {
        continue;
      }

      if (query.metric === "bpm") {
        // Fall 2: höchstes Tempo merken
        if (played.bpm > value) {
          value = played.bpm;
        }
      } else {
        // Fall 3: Übezeit für dieses Rudiment aufsummieren
        value = value + played.durationSeconds;
      }
    }
  }

  return value;
}

export async function getLeaderboard(
  player: Player,
  query: LeaderboardQuery,
): Promise<LeaderboardEntry[]> {
  // Regel: Ein angegebenes Rudiment muss existieren
  if (query.rudimentId !== undefined) {
    const rudiment = getRudimentById(query.rudimentId);
    if (rudiment === undefined) {
      throw new HTTPException(400, { message: "Unbekanntes Rudiment: " + query.rudimentId });
    }
  }

  // Schritt 1: Teilnehmer sammeln, also ich selbst und alle Freunde
  const participants: Player[] = [player];
  const friendIds = await getFriendIds(player);

  for (const friendId of friendIds) {
    const friend = await getPlayerById(friendId);
    if (friend !== undefined) {
      participants.push(friend);
    }
  }

  // Schritt 2: Für jeden Teilnehmer den Wert berechnen
  const startDate = getStartDate(query.period);
  const entries: LeaderboardEntry[] = [];

  for (const participant of participants) {
    const sessions = await getSessionsOfPlayer(participant);
    const value = calculateValue(sessions, query, startDate);

    entries.push({
      rank: 0, // wird in Schritt 4 gesetzt
      friendCode: participant.friendCode,
      name: participant.name,
      value: value,
      isMe: participant.id === player.id,
    });
  }

  // Schritt 3: Absteigend sortieren, höchster Wert oben
  entries.sort(function (a, b) {
    return b.value - a.value;
  });

  // Schritt 4: Plätze vergeben. Gleicher Wert heißt gleicher Platz.
  for (let i = 0; i < entries.length; i++) {
    if (i > 0 && entries[i].value === entries[i - 1].value) {
      entries[i].rank = entries[i - 1].rank;
    } else {
      entries[i].rank = i + 1;
    }
  }

  return entries;
}


