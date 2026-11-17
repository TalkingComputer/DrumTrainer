import { HTTPException } from "@hono/hono/http-exception";
import type { Friendship, Player, PublicPlayer } from "../types.ts";
import { getPlayerByFriendCode, getPlayerById } from "./playerService.ts";
import {
  deleteFriendship,
  findFriendship,
  findFriendshipsOfPlayer,
  insertFriendship,
} from "../repositories/friendshipRepository.ts";

// Macht aus einem vollständigen Player die öffentliche Ansicht ohne id
export function toPublicPlayer(player: Player): PublicPlayer {
  return {
    friendCode: player.friendCode,
    name: player.name,
  };
}

// Liefert die ids aller Freunde. Brauchst du später fürs Leaderboard.
export async function getFriendIds(player: Player): Promise<string[]> {
  const friendships = await findFriendshipsOfPlayer(player.id);
  const friendIds: string[] = [];

  for (const friendship of friendships) {
    // Der Freund ist immer die "andere" Seite des Eintrags
    if (friendship.playerId === player.id) {
      friendIds.push(friendship.friendId);
    } else {
      friendIds.push(friendship.playerId);
    }
  }

  return friendIds;
}

// Freundesliste in der öffentlichen Ansicht
export async function getFriendsOfPlayer(player: Player): Promise<PublicPlayer[]> {
  const friendIds = await getFriendIds(player);
  const friends: PublicPlayer[] = [];

  for (const friendId of friendIds) {
    const friend = await getPlayerById(friendId);
    if (friend !== undefined) {
      friends.push(toPublicPlayer(friend));
    }
  }

  return friends;
}

// Freund hinzufügen
export async function addFriend(player: Player, friendCode: string): Promise<PublicPlayer> {
  const friend = await getPlayerByFriendCode(friendCode);

  // Regel 1: Den Code muss es geben
  if (friend === undefined) {
    throw new HTTPException(404, { message: "Kein Spieler mit diesem Freundescode" });
  }

  // Regel 2: Sich selbst hinzufügen geht nicht
  if (friend.id === player.id) {
    throw new HTTPException(409, { message: "Du kannst dich nicht selbst hinzufügen" });
  }

  // Regel 3: Keine doppelte Freundschaft, egal wer zuerst hinzugefügt hat
  const existing = await findFriendship(player.id, friend.id);
  if (existing !== undefined) {
    throw new HTTPException(409, { message: "Ihr seid bereits befreundet" });
  }

  const newFriendship: Friendship = {
    playerId: player.id,
    friendId: friend.id,
  };
  await insertFriendship(newFriendship);

  return toPublicPlayer(friend);
}

// Freund entfernen
export async function removeFriend(player: Player, friendCode: string): Promise<void> {
  const friend = await getPlayerByFriendCode(friendCode);

  if (friend === undefined) {
    throw new HTTPException(404, { message: "Kein Spieler mit diesem Freundescode" });
  }

  const existing = await findFriendship(player.id, friend.id);
  if (existing === undefined) {
    throw new HTTPException(404, { message: "Dieser Spieler ist nicht in deiner Freundesliste" });
  }

  await deleteFriendship(player.id, friend.id);
}

