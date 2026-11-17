// Speichert die geheime Spieler-id im localStorage des Browsers.
// Nur diese Datei greift auf den localStorage zu.

const STORAGE_KEY = 'drumtrainer.playerId'

// Liest die id. Gibt null zurück, wenn noch keine gespeichert ist.
export function getPlayerId(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    // Manche Browser sperren den localStorage, z. B. im privaten Modus
    return null
  }
}

export function savePlayerId(id: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, id)
  } catch {
    // Ohne localStorage geht die id nach dem Neuladen verloren.
    // Die App funktioniert bis dahin trotzdem.
  }
}

export function clearPlayerId(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // nichts zu tun
  }
}
