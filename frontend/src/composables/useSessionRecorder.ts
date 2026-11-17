// Zeichnet beim Üben automatisch eine Session auf.
//
// - Der erste Klick auf Play startet die Session.
// - Jede Kombination aus Rudiment und Tempo ist ein Abschnitt (PlayedRudiment).
//   Wechselt das Rudiment oder das Tempo, endet der Abschnitt, und ein neuer beginnt.
// - Gezählt wird nur die Zeit, in der das Metronom wirklich läuft. Das gilt für jeden
//   Abschnitt und für die Session-Zeit. In Pausen bleibt die Uhr oben rechts stehen.
//   So wächst eine Session nicht weiter, wenn man vergisst, sie abzuschicken.
//
// Der Recorder beobachtet useMetronome per watch. Das Metronom selbst weiß nichts
// vom Recorder. So bleiben beide Teile unabhängig.
//
// Die Aufnahme wird laufend im localStorage gesichert. Lädt jemand die Seite neu
// oder schließt den Tab aus Versehen, geht die Übezeit nicht verloren.
//
// Zeitmessung mit Date.now() in Millisekunden. Für Übezeiten reicht diese Genauigkeit,
// die Audio-Uhr braucht nur das Metronom selbst.

import { computed, ref, watch } from 'vue'
import type { PlayedRudiment } from '@/types'
import { useMetronome } from './useMetronome'

// Kürzere Abschnitte fallen in der Zusammenfassung weg. Zieht jemand das Tempo
// von 120 auf 140, entstehen sonst 20 Mini-Abschnitte mit Bruchteilen einer Sekunde.
// Gleiche Kombinationen aus Rudiment und Tempo werden vorher zusammengezählt.
// Dreimal 4 Sekunden bei 120 BPM ergeben also 12 Sekunden und bleiben erhalten.
const MIN_SEGMENT_SECONDS = 5

// Der Abschnitt, der gerade läuft oder pausiert
interface OpenSegment {
  rudimentId: string
  bpm: number
  // Bisher gespielte Zeit aus abgeschlossenen Play-Phasen
  playedMs: number
  // Seit wann das Metronom in diesem Abschnitt läuft. null = gerade pausiert
  runningSince: number | null
}

// Fertig aufbereitete Session für das Formular "Session summary"
export interface RecordedSession {
  startDate: Date
  durationSeconds: number
  playedRudiments: PlayedRudiment[]
}

// ---------- Gemeinsamer Zustand (wie bei useMetronome außerhalb der Funktion) ----------

// Wann die Session begonnen hat. Nur für Datum und Startzeit im Formular.
const sessionStartedAt = ref<number | null>(null)
// Gespielte Zeit der ganzen Session, gleiche Technik wie bei den Abschnitten:
// Summe der abgeschlossenen Play-Phasen plus die laufende Phase
const sessionPlayedMs = ref(0)
const sessionRunningSince = ref<number | null>(null)
const closedSegments = ref<PlayedRudiment[]>([])
const openSegment = ref<OpenSegment | null>(null)
// Aktuelle Uhrzeit, jede Sekunde neu. Die Anzeige oben rechts rechnet damit.
const now = ref(Date.now())
let clockTimer: number | undefined = undefined

const { bpm, isPlaying, currentRudimentId } = useMetronome()

// ---------- Hilfsfunktionen ----------

// Gespielte Zeit eines Abschnitts bis zum Zeitpunkt "at"
function segmentMs(segment: OpenSegment, at: number): number {
  if (segment.runningSince === null) {
    return segment.playedMs
  }
  return segment.playedMs + (at - segment.runningSince)
}

// Gespielte Zeit der ganzen Session bis zum Zeitpunkt "at"
function totalPlayedMs(at: number): number {
  if (sessionRunningSince.value === null) {
    return sessionPlayedMs.value
  }
  return sessionPlayedMs.value + (at - sessionRunningSince.value)
}

// Fügt einen Abschnitt zur Liste hinzu. Gibt es Rudiment und Tempo dort schon,
// wird die Zeit addiert statt eine zweite Zeile anzulegen.
function addToList(list: PlayedRudiment[], rudimentId: string, bpmValue: number, seconds: number) {
  for (const existing of list) {
    if (existing.rudimentId === rudimentId && existing.bpm === bpmValue) {
      existing.durationSeconds = existing.durationSeconds + seconds
      return
    }
  }
  list.push({ rudimentId: rudimentId, bpm: bpmValue, durationSeconds: seconds })
}

// Neuen Abschnitt mit dem aktuellen Rudiment und Tempo beginnen
function openNewSegment() {
  if (currentRudimentId.value === null) {
    openSegment.value = null
    return
  }
  openSegment.value = {
    rudimentId: currentRudimentId.value,
    bpm: bpm.value,
    playedMs: 0,
    runningSince: isPlaying.value ? Date.now() : null,
  }
}

// Laufenden Abschnitt abschließen und in die Liste übernehmen
function closeOpenSegment() {
  const segment = openSegment.value
  if (segment === null) {
    return
  }
  const seconds = Math.round(segmentMs(segment, Date.now()) / 1000)
  addToList(closedSegments.value, segment.rudimentId, segment.bpm, seconds)
  openSegment.value = null
}

function startClock() {
  window.clearInterval(clockTimer)
  now.value = Date.now()
  clockTimer = window.setInterval(() => {
    now.value = Date.now()
    // Einmal pro Sekunde sichern, damit auch die laufende Zeit erhalten bleibt
    saveRecording()
  }, 1000)
}

// ---------- Sichern und Wiederherstellen (localStorage) ----------

const STORAGE_KEY = 'drumtrainer.recording'
// Ältere Aufnahmen nicht wiederherstellen. Wer gestern den Tab geschlossen hat,
// will heute keine 20-Stunden-Session vorfinden.
const MAX_RESTORE_AGE_MS = 6 * 60 * 60 * 1000

interface StoredRecording {
  savedAt: number
  sessionStartedAt: number
  sessionPlayedMs: number
  closedSegments: PlayedRudiment[]
  // Ohne runningSince: Nach einem Neuladen ist das Metronom ohnehin gestoppt
  openSegment: { rudimentId: string; bpm: number; playedMs: number } | null
}

function saveRecording() {
  try {
    if (sessionStartedAt.value === null) {
      localStorage.removeItem(STORAGE_KEY)
      return
    }
    const timestamp = Date.now()
    const open = openSegment.value
    const stored: StoredRecording = {
      savedAt: timestamp,
      sessionStartedAt: sessionStartedAt.value,
      sessionPlayedMs: totalPlayedMs(timestamp),
      closedSegments: closedSegments.value,
      openSegment:
        open === null
          ? null
          : { rudimentId: open.rudimentId, bpm: open.bpm, playedMs: segmentMs(open, timestamp) },
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored))
  } catch {
    // localStorage gesperrt oder voll: Aufnahme läuft trotzdem, nur ohne Sicherung
  }
}

function restoreRecording() {
  try {
    const text = localStorage.getItem(STORAGE_KEY)
    if (text === null) {
      return
    }
    const stored: StoredRecording = JSON.parse(text)
    if (Date.now() - stored.savedAt > MAX_RESTORE_AGE_MS) {
      localStorage.removeItem(STORAGE_KEY)
      return
    }
    sessionStartedAt.value = stored.sessionStartedAt
    // Nach dem Neuladen ist das Metronom gestoppt, die Uhr steht also
    sessionPlayedMs.value = stored.sessionPlayedMs ?? 0
    sessionRunningSince.value = null
    closedSegments.value = stored.closedSegments
    openSegment.value =
      stored.openSegment === null ? null : { ...stored.openSegment, runningSince: null }
    startClock()
  } catch {
    // Kaputte Daten: ignorieren und ohne Aufnahme starten
    localStorage.removeItem(STORAGE_KEY)
  }
}

// Beim Laden der App einmal versuchen, eine Aufnahme wiederherzustellen
restoreRecording()

// ---------- Auf das Metronom reagieren ----------

// Play und Pause
watch(isPlaying, (playing) => {
  const timestamp = Date.now()

  if (playing) {
    // Erstes Play: Die Session beginnt
    if (sessionStartedAt.value === null) {
      sessionStartedAt.value = timestamp
      startClock()
    }
    // Session-Uhr läuft weiter
    sessionRunningSince.value = timestamp
    // Abschnitt fortsetzen oder neu beginnen
    if (openSegment.value === null) {
      openNewSegment()
    } else {
      openSegment.value.runningSince = timestamp
    }
    return
  }

  // Pause: Session-Uhr anhalten und die bisher gespielte Zeit sichern
  if (sessionRunningSince.value !== null) {
    sessionPlayedMs.value = sessionPlayedMs.value + (timestamp - sessionRunningSince.value)
    sessionRunningSince.value = null
  }

  // Ebenso im laufenden Abschnitt
  const segment = openSegment.value
  if (segment !== null && segment.runningSince !== null) {
    segment.playedMs = segment.playedMs + (timestamp - segment.runningSince)
    segment.runningSince = null
  }
  saveRecording()
})

// Rudiment oder Tempo gewechselt: neuer Abschnitt
watch([currentRudimentId, bpm], () => {
  if (sessionStartedAt.value === null) {
    return
  }
  closeOpenSegment()
  openNewSegment()
  saveRecording()
})

// ---------- Werte für die Anzeige ----------

const hasSession = computed(() => sessionStartedAt.value !== null)

// Session-Zeit: nur die Zeit, in der das Metronom lief.
// now ändert sich jede Sekunde, dadurch rechnet computed laufend neu.
// In der Pause ändert sich das Ergebnis trotzdem nicht, weil sessionRunningSince null ist.
const sessionSeconds = computed(() => Math.floor(totalPlayedMs(now.value) / 1000))

// Anzahl verschiedener Rudimente bisher (nur Abschnitte, die auch gezählt werden)
const rudimentCount = computed(() => {
  // Set: eine Liste ohne doppelte Einträge
  const ids = new Set<string>()
  for (const segment of closedSegments.value) {
    if (segment.durationSeconds >= MIN_SEGMENT_SECONDS) {
      ids.add(segment.rudimentId)
    }
  }
  if (openSegment.value !== null) {
    ids.add(openSegment.value.rudimentId)
  }
  return ids.size
})

// ---------- Ergebnis und Zurücksetzen ----------

// Momentaufnahme der Session für das Formular. Der laufende Abschnitt wird
// mitgezählt, bleibt aber offen. Schließt man das Formular, läuft die Aufnahme weiter.
function buildSummary(): RecordedSession | null {
  if (sessionStartedAt.value === null) {
    return null
  }
  const timestamp = Date.now()

  // Kopie der Liste, damit die Momentaufnahme die Aufnahme nicht verändert
  const allSegments: PlayedRudiment[] = []
  for (const segment of closedSegments.value) {
    allSegments.push({ ...segment })
  }
  const open = openSegment.value
  if (open !== null) {
    addToList(allSegments, open.rudimentId, open.bpm, Math.round(segmentMs(open, timestamp) / 1000))
  }

  // Zu kurze Abschnitte weglassen
  const played: PlayedRudiment[] = []
  for (const segment of allSegments) {
    if (segment.durationSeconds >= MIN_SEGMENT_SECONDS) {
      played.push(segment)
    }
  }

  let practiceSeconds = 0
  for (const segment of played) {
    practiceSeconds = practiceSeconds + segment.durationSeconds
  }

  // Durch das Runden pro Abschnitt kann die Summe minimal über der Session-Zeit liegen.
  // Das Backend würde das ablehnen, also die Session-Zeit notfalls anpassen.
  const playedSeconds = Math.round(totalPlayedMs(timestamp) / 1000)
  const durationSeconds = Math.max(playedSeconds, practiceSeconds)

  return {
    startDate: new Date(sessionStartedAt.value),
    durationSeconds: durationSeconds,
    playedRudiments: played,
  }
}

// Nach dem Speichern oder Verwerfen: alles auf Anfang
function resetRecording() {
  window.clearInterval(clockTimer)
  clockTimer = undefined
  sessionStartedAt.value = null
  sessionPlayedMs.value = 0
  sessionRunningSince.value = null
  closedSegments.value = []
  openSegment.value = null
  saveRecording() // entfernt die Sicherung
}

export function useSessionRecorder() {
  return {
    hasSession,
    sessionSeconds,
    rudimentCount,
    buildSummary,
    resetRecording,
  }
}
