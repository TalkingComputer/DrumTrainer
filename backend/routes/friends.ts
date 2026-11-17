import { Hono } from "@hono/hono";
import { HTTPException } from "@hono/hono/http-exception";
import type { AppEnv } from "../types.ts";
import { readBody } from "../utils/readBody.ts";
import { addFriend, getFriendsOfPlayer, removeFriend } from "../services/friendService.ts";

const friends = new Hono<AppEnv>();

// Bringt den Code in eine einheitliche Form: " drum-4821 " wird zu "DRUM-4821"
function normalizeFriendCode(code: string): string {
  return code.trim().toUpperCase();
}

// Prüft die Form des Bodys und gibt den Freundescode zurück
function checkFriendBody(body: any): string {
  if (body === null || typeof body !== "object") {
    throw new HTTPException(400, { message: "Body muss ein JSON-Objekt sein" });
  }

  if (typeof body.friendCode !== "string" || body.friendCode.trim().length === 0) {
    throw new HTTPException(400, { message: "Feld 'friendCode' fehlt oder ist leer" });
  }

  return normalizeFriendCode(body.friendCode);
}

// GET /api/players/me/friends
friends.get("/", async (c) => {
  const player = c.get("player");
  const friendList = await getFriendsOfPlayer(player);
  return c.json(friendList);
});

// POST /api/players/me/friends
friends.post("/", async (c) => {
  const player = c.get("player");
  const body = await readBody(c.req.raw);
  const friendCode = checkFriendBody(body);
  const newFriend = await addFriend(player, friendCode);
  return c.json(newFriend, 201);
});

// DELETE /api/players/me/friends/:friendCode
friends.delete("/:friendCode", async (c) => {
  const player = c.get("player");
  const friendCode = normalizeFriendCode(c.req.param("friendCode"));
  await removeFriend(player, friendCode);
  return c.body(null, 204);
});

export default friends;