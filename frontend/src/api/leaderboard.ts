import type { LeaderboardEntry, LeaderboardFilter } from '@/types'
import { apiRequest } from './client'

// GET /api/players/me/leaderboard?metric=…&period=…&rudimentId=…
export function getLeaderboard(filter: LeaderboardFilter): Promise<LeaderboardEntry[]> {
  // URLSearchParams baut die Query sauber zusammen und kodiert Sonderzeichen
  const params = new URLSearchParams()
  params.set('metric', filter.metric)
  params.set('period', filter.period)
  if (filter.rudimentId !== undefined) {
    params.set('rudimentId', filter.rudimentId)
  }

  return apiRequest<LeaderboardEntry[]>('GET', '/players/me/leaderboard?' + params.toString())
}
