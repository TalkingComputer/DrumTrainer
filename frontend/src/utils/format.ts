// Hilfsfunktionen, die Datum und Dauer für die Anzeige aufbereiten.
// Sie ändern keine Daten, sie machen nur Text daraus.

// Intl.DateTimeFormat ist im Browser eingebaut und formatiert Datumswerte.
// 'en-GB' ergibt die Reihenfolge "16 Nov 2026" wie im Figma-Entwurf.
const weekdayFormat = new Intl.DateTimeFormat('en-GB', { weekday: 'short' })
const dateFormat = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})
const timeFormat = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' })

// "2026-11-16T17:30:00.000Z" → "Mon, 16 Nov 2026 · 18:30" (in der Zeitzone des Browsers)
export function formatSessionDate(isoDate: string): string {
  const date = new Date(isoDate)
  return (
    weekdayFormat.format(date) + ', ' + dateFormat.format(date) + ' · ' + timeFormat.format(date)
  )
}

// "2026-11-16T17:30:00.000Z" → "16 Nov 2026"
export function formatShortDate(isoDate: string): string {
  return dateFormat.format(new Date(isoDate))
}

// Zahl mit führender Null: 5 → "05"
function twoDigits(value: number): string {
  return String(value).padStart(2, '0')
}

// Sekunden als Uhr ohne Einheit: 1570 → "26:10", 3725 → "1:02:05"
export function formatTimer(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (hours > 0) {
    return hours + ':' + twoDigits(minutes) + ':' + twoDigits(seconds)
  }
  return minutes + ':' + twoDigits(seconds)
}

// Sekunden als Uhr mit Einheit: 1570 → "26:10 min", 3725 → "1:02:05 h"
export function formatClock(totalSeconds: number): string {
  if (totalSeconds >= 3600) {
    return formatTimer(totalSeconds) + ' h'
  }
  return formatTimer(totalSeconds) + ' min'
}

// Sekunden grob gerundet: 480 → "8 min", 45 → "45 s"
export function formatMinutes(totalSeconds: number): string {
  if (totalSeconds < 60) {
    return totalSeconds + ' s'
  }
  return Math.round(totalSeconds / 60) + ' min'
}

// Übezeit als Stunden und Minuten: 6120 → "1:42 h", 2520 → "42 min", 45 → "45 s"
export function formatPracticeTime(totalSeconds: number): string {
  // Unter einer Minute: Sekunden statt "0 min". Genau 0 bleibt "0 min".
  if (totalSeconds > 0 && totalSeconds < 60) {
    return totalSeconds + ' s'
  }

  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)

  if (hours > 0) {
    return hours + ':' + twoDigits(minutes) + ' h'
  }
  return minutes + ' min'
}
