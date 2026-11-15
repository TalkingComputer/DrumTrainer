import type { Player } from "../types.ts";
import { readDb, writeDb } from "./db.ts";

// Sucht einen Spieler anhand seiner geheimen id
export async function findPlayerById(id: string): Promise<Player | undefined> {
  const db = await readDb();

  for (const player of db.players) {
    if (player.id === id) {
      return player;
    }
  }

  return undefined;
}

// Sucht einen Spieler anhand seines öffentlichen Freundescodes
export async function findPlayerByFriendCode(friendCode: string): Promise<Player | undefined> {
  const db = await readDb();

  for (const player of db.players) {
    if (player.friendCode === friendCode) {
      return player;
    }
  }

  return undefined;
}

// Fügt einen neuen Spieler hinzu und speichert
export async function insertPlayer(newPlayer: Player): Promise<void> {
  const db = await readDb();
  db.players.push(newPlayer);
  await writeDb(db);
}

// Ersetzt einen bestehenden Spieler und speichert
export async function updatePlayer(changedPlayer: Player): Promise<void> {
  const db = await readDb();

  for (let i = 0; i < db.players.length; i++) {
    if (db.players[i].id === changedPlayer.id) {
      db.players[i] = changedPlayer;
    }
  }

  await writeDb(db);
}