import type { Player } from "../types.ts";
import {
  findPlayerByFriendCode,
  findPlayerById,
  insertPlayer,
  updatePlayer,
} from "../repositories/playerRepository.ts";

// Erzeugt einen zufälligen Code wie "DRUM-4821"
function createRandomFriendCode(): string {
  const randomNumber = Math.floor(1000 + Math.random() * 9000);
  return "DRUM-" + randomNumber;
}

// Würfelt so lange, bis ein Code gefunden ist, den noch niemand hat
async function createUniqueFriendCode(): Promise<string> {
  while (true) {
    const code = createRandomFriendCode();
    const existingPlayer = await findPlayerByFriendCode(code);

    if (existingPlayer === undefined) {
      return code;
    }
  }
}

// Legt einen neuen Spieler an
export async function createPlayer(name: string): Promise<Player> {
  const id = crypto.randomUUID();
  const friendCode = await createUniqueFriendCode();

  const newPlayer: Player = {
    id: id,
    friendCode: friendCode,
    name: name,
  };

  await insertPlayer(newPlayer);
  return newPlayer;
}

// Holt einen Spieler anhand seiner id
export async function getPlayerById(id: string): Promise<Player | undefined> {
  const player = await findPlayerById(id);
  return player;
}

// Ändert den Namen eines Spielers
export async function renamePlayer(player: Player, newName: string): Promise<Player> {
  const changedPlayer: Player = {
    id: player.id,
    friendCode: player.friendCode,
    name: newName,
  };

  await updatePlayer(changedPlayer);
  return changedPlayer;
}