export interface Player {
  id: string;
  friendCode: string;
  name: string;
}

export interface Rudiment {
  id: string;
  name: string;
  pattern: string;       // Notation als Text, z. B. "16R> 16L 16R 16R"
  beamGroup?: number;    // Balkenlänge in Vierteln. Das ? heißt: Feld darf fehlen
}

export interface PlayedRudiment {
  rudimentId: string;
  bpm: number;
  durationSeconds: number;
}

export interface Session {
  id: string;
  playerId: string;
  date: string;
  durationSeconds: number;
  playedRudiments: PlayedRudiment[];
}

export interface Friendship {
  playerId: string;
  friendId: string;
}

export interface Database {
  players: Player[];
  sessions: Session[];
  friendships: Friendship[];
}

export interface AppEnv {
  Variables: {
    player: Player;
  };
}

// Das, was das Frontend beim Anlegen schickt.
// Ohne id und playerId, denn die setzt der Server selbst.
export interface SessionInput {
  date: string;
  durationSeconds: number;
  playedRudiments: PlayedRudiment[];
}

// Das, was andere Spieler von einem Spieler sehen dürfen. Ohne id!
export interface PublicPlayer {
  friendCode: string;
  name: string;
}


// Ein "Union Type": Die Variable darf nur genau einen dieser Texte enthalten.
// Bei "metric = 'tempo'" meckert der Editor sofort.
export type Metric = "bpm" | "duration";
export type Period = "week" | "month" | "all";

// Die geprüften Filter aus der URL
export interface LeaderboardQuery {
  metric: Metric;
  period: Period;
  rudimentId: string | undefined;
}

// Eine Zeile im Leaderboard. Ohne id!
export interface LeaderboardEntry {
  rank: number;
  friendCode: string;
  name: string;
  value: number;      // BPM oder Sekunden, je nach metric
  isMe: boolean;      // true in der eigenen Zeile, damit das Frontend sie hervorheben kann
}