import type { Session, SessionInput } from '@/types'
import { apiRequest } from './client'

// GET /api/players/me/sessions → eigene Sessions, neueste zuerst
export function getSessions(): Promise<Session[]> {
  return apiRequest<Session[]>('GET', '/players/me/sessions')
}

// POST /api/players/me/sessions → neue Session speichern
export function createSession(input: SessionInput): Promise<Session> {
  return apiRequest<Session>('POST', '/players/me/sessions', input)
}

// GET /api/players/me/sessions/:sessionId → eine einzelne Session
export function getSession(sessionId: string): Promise<Session> {
  return apiRequest<Session>('GET', '/players/me/sessions/' + encodeURIComponent(sessionId))
}

// PATCH /api/players/me/sessions/:sessionId → Session korrigieren
export function updateSession(sessionId: string, input: SessionInput): Promise<Session> {
  return apiRequest<Session>(
    'PATCH',
    '/players/me/sessions/' + encodeURIComponent(sessionId),
    input,
  )
}

// DELETE /api/players/me/sessions/:sessionId
export function deleteSession(sessionId: string): Promise<void> {
  return apiRequest<void>('DELETE', '/players/me/sessions/' + encodeURIComponent(sessionId))
}
