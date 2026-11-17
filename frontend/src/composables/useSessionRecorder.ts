// Zeichnet beim Üben automatisch eine Session auf.
//
// - Der erste Klick auf Play startet die Session.
// - Jede Kombination aus Rudiment und Tempo ist ein Abschnitt (PlayedRudiment).
//   Wechselt das Rudiment oder das Tempo, endet der Abschnitt, und ein neuer beginnt.
// - Ein Abschnitt zählt nur die Zeit, in der das Metronom wirklich läuft.
//   Die Session-Zeit läuft dagegen ab dem ersten Play durch, auch in Pausen.
//
// Der Recorder beobachtet useMetronome per watch. Das Metronom selbst weiß nichts
// vom Recorder. So bleiben beide Teile unabhängig.
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

const sessionStartedAt = ref<number | null>(null)
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
  }, 1000)
}

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
    // Abschnitt fortsetzen oder neu beginnen
    if (openSegment.value === null) {
      openNewSegment()
    } else {
      openSegment.value.runningSince = timestamp
    }
    return
  }

  // Pause: bisher gespielte Zeit im Abschnitt sichern
  const segment = openSegment.value
  if (segment !== null && segment.runningSince !== null) {
    segment.playedMs = segment.playedMs + (timestamp - segment.runningSince)
    segment.runningSince = null
  }
})

// Rudiment oder Tempo gewechselt: neuer Abschnitt
watch([currentRudimentId, bpm], () => {
  if (sessionStartedAt.value === null) {
    return
  }
  closeOpenSegment()
  openNewSegment()
})

// ---------- Werte für die Anzeige ----------

const hasSession = computed(() => sessionStartedAt.value !== null)

// Session-Zeit inklusive Pausen
const sessionSeconds = computed(() => {
  if (sessionStartedAt.value === null) {
    return 0
  }
  return Math.floor((now.value - sessionStartedAt.value) / 1000)
})

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
  const elapsedSeconds = Math.round((timestamp - sessionStartedAt.value) / 1000)
  const durationSeconds = Math.max(elapsedSeconds, practiceSeconds)

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
  closedSegments.value = []
  openSegment.value = null
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
