// Baupläne für alle Daten, die zwischen Frontend und Backend hin- und hergehen.
// Sie entsprechen den Antworten der API (siehe backend/types.ts).

// Der eigene Spieler, wie ihn POST /api/players und GET /api/players/me liefern
export interface Player {
  id: string
  friendCode: string
  name: string
}

// Ein anderer Spieler, z. B. in der Freundesliste. Ohne id
export interface PublicPlayer {
  friendCode: string
  name: string
}

export interface Rudiment {
  id: string
  name: string
  pattern: string
  beamGroup?: number
}

export interface PlayedRudiment {
  rudimentId: string
  bpm: number
  durationSeconds: number
}

export interface Session {
  id: string
  playerId: string
  date: string
  durationSeconds: number
  playedRudiments: PlayedRudiment[]
}

// Das, was das Frontend beim Speichern einer Session schickt
export interface SessionInput {
  date: string
  durationSeconds: number
  playedRudiments: PlayedRudiment[]
}

export type Metric = 'bpm' | 'duration'
export type Period = 'week' | 'month' | 'all'

// Die Filter für das Leaderboard
export interface LeaderboardFilter {
  metric: Metric
  period: Period
  rudimentId: string | undefined
}

export interface LeaderboardEntry {
  rank: number
  friendCode: string
  name: string
  value: number
  isMe: boolean
}
