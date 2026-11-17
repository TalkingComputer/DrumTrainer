import type { PublicPlayer } from '@/types'
import { apiRequest } from './client'

// GET /api/players/me/friends → Freundesliste
export function getFriends(): Promise<PublicPlayer[]> {
  return apiRequest<PublicPlayer[]>('GET', '/players/me/friends')
}

// POST /api/players/me/friends → Freund per Code hinzufügen
export function addFriend(friendCode: string): Promise<PublicPlayer> {
  return apiRequest<PublicPlayer>('POST', '/players/me/friends', { friendCode: friendCode })
}

// DELETE /api/players/me/friends/:friendCode
export function removeFriend(friendCode: string): Promise<void> {
  return apiRequest<void>('DELETE', '/players/me/friends/' + encodeURIComponent(friendCode))
}
