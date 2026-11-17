import type { Friendship } from "../types.ts";
import { readDb, writeDb } from "./db.ts";

// Prüft, ob ein Eintrag zwei bestimmte Spieler verbindet, egal in welcher Richtung
function connects(friendship: Friendship, playerA: string, playerB: string): boolean {
  const aAddedB = friendship.playerId === playerA && friendship.friendId === playerB;
  const bAddedA = friendship.playerId === playerB && friendship.friendId === playerA;
  return aAddedB || bAddedA;
}

// Alle Freundschaften, an denen der Spieler beteiligt ist, egal auf welcher Seite
export async function findFriendshipsOfPlayer(playerId: string): Promise<Friendship[]> {
  const db = await readDb();
  const result: Friendship[] = [];

  for (const friendship of db.friendships) {
    if (friendship.playerId === playerId || friendship.friendId === playerId) {
      result.push(friendship);
    }
  }

  return result;
}

// Sucht die Freundschaft zwischen zwei bestimmten Spielern
export async function findFriendship(playerA: string, playerB: string): Promise<Friendship | undefined> {
  const db = await readDb();

  for (const friendship of db.friendships) {
    if (connects(friendship, playerA, playerB)) {
      return friendship;
    }
  }

  return undefined;
}

export async function insertFriendship(newFriendship: Friendship): Promise<void> {
  const db = await readDb();
  db.friendships.push(newFriendship);
  await writeDb(db);
}

// Löscht die Freundschaft zwischen zwei Spielern, egal wer wen hinzugefügt hat
export async function deleteFriendship(playerA: string, playerB: string): Promise<void> {
  const db = await readDb();
  const remaining: Friendship[] = [];

  for (const friendship of db.friendships) {
    if (!connects(friendship, playerA, playerB)) {
      remaining.push(friendship);
    }
  }

  db.friendships = remaining;
  await writeDb(db);
}