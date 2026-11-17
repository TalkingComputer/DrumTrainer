// Holt die Fehlermeldung aus einem abgefangenen Fehler.
//
// In einem catch-Block kann "error" alles Mögliche sein, nicht nur ein Error-Objekt.
// Ist es ein Error (z. B. ApiError aus client.ts), nehmen wir dessen Meldung.
// Sonst den Ersatztext, den der Aufrufer mitgibt.
export function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) {
    return error.message
  }
  return fallback
}
