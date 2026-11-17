// Umrechnung zwischen Eingabefeldern und Sekunden bzw. Datumswerten.
// Gegenstück zu format.ts: format.ts macht Text für die Anzeige,
// diese Datei liest Text aus Formularfeldern wieder ein.

// Liest eine Dauer aus einem Textfeld.
// Erlaubt sind "8:00" (Minuten:Sekunden) und "8" (nur Minuten).
// Gibt die Sekunden zurück oder null, wenn der Text keine gültige Dauer ist.
export function parseDuration(text: string): number | null {
  const trimmed = text.trim()

  // Nur Minuten, z. B. "8"
  if (/^\d+$/.test(trimmed)) {
    return Number(trimmed) * 60
  }

  // Minuten und Sekunden, z. B. "8:00" oder "12:30"
  const match = /^(\d+):(\d{1,2})$/.exec(trimmed)
  if (match === null) {
    return null
  }
  const minutes = Number(match[1])
  const seconds = Number(match[2])
  if (seconds > 59) {
    return null
  }
  return minutes * 60 + seconds
}

// Sekunden als Text für ein Eingabefeld: 480 → "8:00"
export function toDurationText(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return minutes + ':' + String(seconds).padStart(2, '0')
}

function twoDigits(value: number): string {
  return String(value).padStart(2, '0')
}

// Datum für <input type="date">: "2026-11-16" (Ortszeit)
export function toDateInputValue(date: Date): string {
  return date.getFullYear() + '-' + twoDigits(date.getMonth() + 1) + '-' + twoDigits(date.getDate())
}

// Uhrzeit für <input type="time">: "18:30" (Ortszeit)
export function toTimeInputValue(date: Date): string {
  return twoDigits(date.getHours()) + ':' + twoDigits(date.getMinutes())
}

// Setzt Datum und Uhrzeit aus den beiden Feldern wieder zusammen.
// Ohne Zeitzonen-Angabe liest der Browser den Text als Ortszeit.
// Gibt null zurück, wenn ein Feld leer oder ungültig ist.
export function combineDateAndTime(dateText: string, timeText: string): Date | null {
  if (dateText === '' || timeText === '') {
    return null
  }
  const date = new Date(dateText + 'T' + timeText)
  if (isNaN(date.getTime())) {
    return null
  }
  return date
}
