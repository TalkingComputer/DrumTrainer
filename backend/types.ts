export interface Player {
  id: string;
  friendCode: string;
  name: string;
}

export interface Rudiment {
  id: string;
  name: string;
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
  rudiments: Rudiment[];
  sessions: Session[];
  friendships: Friendship[];
}

export interface AppEnv {
  Variables: {
    player: Player;
  };
}