import type { Player } from '@/types'
import { apiRequest } from './client'

// POST /api/players → neuen Spieler anlegen
export function createPlayer(name: string): Promise<Player> {
  return apiRequest<Player>('POST', '/players', { name: name })
}

// GET /api/players/me → eigenes Profil
export function getMe(): Promise<Player> {
  return apiRequest<Player>('GET', '/players/me')
}

// PATCH /api/players/me → Namen ändern
export function renameMe(name: string): Promise<Player> {
  return apiRequest<Player>('PATCH', '/players/me', { name: name })
}
