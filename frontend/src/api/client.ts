// Zentrale Hilfsfunktion für alle Anfragen an das Backend.
// Alle anderen Dateien in src/api/ nutzen apiRequest, niemand ruft fetch direkt auf.

import { clearPlayerId, getPlayerId } from './playerId'

// Eigene Fehlerklasse. Sie merkt sich zusätzlich den HTTP-Statuscode.
// So kann eine Komponente z. B. auf 409 anders reagieren als auf 404.
export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE'

// Schickt eine Anfrage an /api + path.
// <T> ist ein Platzhalter für den Typ der Antwort. Der Aufrufer legt ihn fest,
// z. B. apiRequest<Player>(...) liefert ein Player-Objekt.
// body? heißt: Der Parameter ist optional. GET und DELETE schicken keinen Body.
export async function apiRequest<T>(method: HttpMethod, path: string, body?: unknown): Promise<T> {
  // 1. Header zusammenstellen
  const headers: Record<string, string> = {}

  const playerId = getPlayerId()
  if (playerId !== null) {
    headers['X-Player-Id'] = playerId
  }

  let bodyText: string | undefined = undefined
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
    bodyText = JSON.stringify(body)
  }

  // 2. Anfrage senden. Läuft das Backend nicht, wirft fetch einen Fehler.
  let response: Response
  try {
    response = await fetch('/api' + path, {
      method: method,
      headers: headers,
      body: bodyText,
    })
  } catch {
    throw new ApiError(0, 'Server not reachable. Is the backend running?')
  }

  // 3. Fehler vom Backend: Meldung aus { "error": "..." } übernehmen
  if (!response.ok) {
    let message = 'Request failed (' + response.status + ')'
    try {
      const data = await response.json()
      if (typeof data.error === 'string') {
        message = data.error
      }
    } catch {
      // Antwort war kein JSON, Standardmeldung bleibt
    }

    // 401: Das Backend kennt die gespeicherte id nicht (mehr).
    // Die id ist damit wertlos, also löschen. Beim nächsten Seitenwechsel
    // leitet der Navigation Guard dann automatisch zum Onboarding.
    if (response.status === 401) {
      clearPlayerId()
    }

    throw new ApiError(response.status, message)
  }

  // 4. Erfolg ohne Inhalt (204 beim Löschen)
  if (response.status === 204) {
    return undefined as T
  }

  // 5. Erfolg mit Inhalt
  const data = await response.json()
  return data as T
}
