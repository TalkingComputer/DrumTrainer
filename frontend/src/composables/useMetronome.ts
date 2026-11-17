// Gemeinsamer Zustand des Metronoms.
// Die Variablen stehen AUSSERHALB der Funktion. Dadurch existieren sie nur einmal,
// und jede Komponente, die useMetronome() aufruft, sieht dieselben Werte.
// Ändert der Tempo-Dialog das BPM, sieht der Übe-Bildschirm die Änderung sofort.
//
// Aufbau der Datei:
//   1. Zustand (BPM, Takt, Rudiment, Automation)
//   2. Einfache Funktionen zum Ändern des Zustands
//   3. Audio: Lookahead-Scheduler nach "A Tale of Two Clocks" (Chris Wilson)
//   4. Automation (Tempo-Trainer): erhöht das Tempo alle N Takte

import { computed, ref } from 'vue'
import { playClick } from '@/audio/clickSound'

// Gleicher Bereich wie im Backend (sessionService.ts)
export const MIN_BPM = 20
export const MAX_BPM = 400

// Erlaubte Schläge pro Takt
export const MIN_BEATS = 1
export const MAX_BEATS = 12

// ---------------------------------------------------------------------------
// 1. Zustand
// ---------------------------------------------------------------------------

const bpm = ref(120)
const beatsPerMeasure = ref(4)
// Aktueller Schlag im Takt, beginnend bei 0. -1 heißt: Metronom steht.
const currentBeat = ref(-1)
// Zählt jeden gespielten Schlag hoch. Der BeatIndicator nutzt das,
// um den Impuls auch dann neu zu starten, wenn derselbe Punkt aktiv bleibt (1 Schlag pro Takt).
const beatPulse = ref(0)
const isPlaying = ref(false)
// id des gewählten Rudiments, null solange noch keins gewählt ist
const currentRudimentId = ref<string | null>(null)

// Einstellungen der Automation (Tempo-Trainer). Der Tempo-Dialog stellt sie ein.
const automation = ref({
  startBpm: 100,
  endBpm: 140,
  stepBpm: 5,
  everyMeasures: 4,
})

// Laufende Automation
const isAutomationRunning = ref(false)
// Welche Stufe gerade spielt, beginnend bei 1 (= Start-Tempo)
const automationStep = ref(1)
// Wie viele ganze Takte in der aktuellen Stufe schon gespielt sind
const automationMeasuresDone = ref(0)

// ---------------------------------------------------------------------------
// 2. Zustand ändern
// ---------------------------------------------------------------------------

// Setzt das Tempo und hält es im erlaubten Bereich.
// Nur intern: Die Automation ändert das Tempo hierüber, ohne sich selbst zu beenden.
function applyBpm(value: number): void {
  let newBpm = Math.round(value)
  if (newBpm < MIN_BPM) {
    newBpm = MIN_BPM
  }
  if (newBpm > MAX_BPM) {
    newBpm = MAX_BPM
  }
  bpm.value = newBpm
}

// Tempo von Hand ändern (Pfeile, Ziehen, Tap Tempo, Tempo-Dialog).
// Wer selbst eingreift, beendet damit eine laufende Automation.
function setBpm(value: number): void {
  stopAutomation()
  applyBpm(value)
}

function increaseBpm(): void {
  setBpm(bpm.value + 1)
}

function decreaseBpm(): void {
  setBpm(bpm.value - 1)
}

// Setzt die Schläge pro Takt und hält sie im erlaubten Bereich
function setBeatsPerMeasure(value: number): void {
  let newBeats = Math.round(value)
  if (newBeats < MIN_BEATS) {
    newBeats = MIN_BEATS
  }
  if (newBeats > MAX_BEATS) {
    newBeats = MAX_BEATS
  }
  beatsPerMeasure.value = newBeats
}

function increaseBeats(): void {
  setBeatsPerMeasure(beatsPerMeasure.value + 1)
}

function decreaseBeats(): void {
  setBeatsPerMeasure(beatsPerMeasure.value - 1)
}

function selectRudiment(rudimentId: string): void {
  currentRudimentId.value = rudimentId
}

// ---------------------------------------------------------------------------
// 3. Audio: Lookahead-Scheduler
// ---------------------------------------------------------------------------
//
// Das Problem: JavaScript-Timer (setInterval) sind ungenau. Sie kommen gern
// ein paar Millisekunden zu spät, beim Scrollen oder Rendern auch mehr.
// Ein Metronom, das so seine Klicks auslöst, "eiert" hörbar.
//
// Die Lösung mit zwei Uhren:
//   - Ungenaue Uhr (Timer, alle 25 ms): weckt nur den Scheduler auf.
//   - Genaue Uhr (audioContext.currentTime): Der Scheduler plant jeden Klick
//     mit exaktem Zeitpunkt auf dieser Uhr. Abspielen übernimmt der Browser
//     selbst, unabhängig davon, was JavaScript gerade tut.
//
// Der Scheduler schaut bei jedem Aufwachen 100 ms in die Zukunft und plant alle
// Klicks, die in dieses Fenster fallen. So ist immer ein kleiner Vorrat geplant,
// auch wenn der Timer mal zu spät kommt.
//
//   Zeit ──────────────────────────────────────────────►
//   jetzt ├──── 100 ms Vorschau ────┤
//          ● Klick 1     ● Klick 2      (geplant)       ● Klick 3 (noch nicht)

// Wie oft der Scheduler aufwacht
const LOOKAHEAD_MS = 25
// Wie weit er in die Zukunft plant
const SCHEDULE_AHEAD_SECONDS = 0.1

let audioContext: AudioContext | null = null
let timerWorker: Worker | null = null
let animationFrameId: number | null = null

// Wann der nächste Klick fällig ist (Sekunden auf der Audio-Uhr)
let nextClickTime = 0
// Welcher Schlag im Takt als nächstes kommt (0 = Schlag 1)
let nextBeatInMeasure = 0

// Warteschlange: geplante, aber noch nicht angezeigte Schläge.
// Die Anzeige (BeatIndicator) liest sie aus, sobald ihr Zeitpunkt erreicht ist.
interface ScheduledClick {
  beat: number
  time: number
  oscillator: OscillatorNode
}
const scheduledClicks: ScheduledClick[] = []

// Der Scheduler: plant alle Klicks bis 100 ms in die Zukunft
function scheduleClicks(): void {
  if (audioContext === null) {
    return
  }
  const now = audioContext.currentTime

  // Hing der Browser länger (z. B. Rechner im Standby), liegt der nächste Klick
  // schon in der Vergangenheit. Dann nicht alle verpassten Klicks auf einmal
  // nachholen, sondern ab jetzt neu einsetzen.
  if (nextClickTime < now - 0.05) {
    nextClickTime = now + 0.05
  }

  while (nextClickTime < now + SCHEDULE_AHEAD_SECONDS) {
    // Wurden die Schläge pro Takt gerade verringert, wieder bei Schlag 1 anfangen
    if (nextBeatInMeasure >= beatsPerMeasure.value) {
      nextBeatInMeasure = 0
    }

    // Taktanfang: Die Automation prüft, ob das Tempo steigen soll.
    // Das passiert VOR dem Planen dieses Klicks. Das neue Tempo beginnt also
    // genau auf Schlag 1, und der Abstand zum nächsten Klick nutzt es schon.
    if (nextBeatInMeasure === 0) {
      onMeasureStart()
    }

    const oscillator = playClick(audioContext, nextClickTime, nextBeatInMeasure === 0)
    scheduledClicks.push({ beat: nextBeatInMeasure, time: nextClickTime, oscillator })

    // Abstand zum nächsten Klick: 60 Sekunden geteilt durch BPM.
    // Ändert sich das BPM während des Spielens, gilt es ab dem nächsten Klick.
    nextClickTime = nextClickTime + 60 / bpm.value
    nextBeatInMeasure = (nextBeatInMeasure + 1) % beatsPerMeasure.value
  }
}

// Anzeige-Schleife: läuft mit jedem Bildschirm-Frame (ca. 60 mal pro Sekunde).
// Sie schaut, welche geplanten Klicks inzwischen erklungen sind, und setzt den
// aktiven Beat-Punkt. So leuchtet der Punkt genau dann, wenn der Klick zu hören ist,
// nicht schon beim Planen 100 ms vorher.
function updateDisplay(): void {
  if (audioContext !== null) {
    const now = audioContext.currentTime
    let lastPlayed: ScheduledClick | undefined = undefined

    // Alle Klicks entnehmen, deren Zeitpunkt erreicht ist. Bei einem Tab-Wechsel
    // können das mehrere sein, angezeigt wird nur der neueste.
    let nextInQueue = scheduledClicks[0]
    while (nextInQueue !== undefined && nextInQueue.time <= now) {
      lastPlayed = scheduledClicks.shift()
      nextInQueue = scheduledClicks[0]
    }

    if (lastPlayed !== undefined) {
      currentBeat.value = lastPlayed.beat
      beatPulse.value = beatPulse.value + 1
    }
  }
  animationFrameId = requestAnimationFrame(updateDisplay)
}

// Den Worker erst beim ersten Start erzeugen und dann wiederverwenden
function getTimerWorker(): Worker {
  if (timerWorker === null) {
    // new URL(…, import.meta.url): So findet Vite die Worker-Datei und baut sie mit
    timerWorker = new Worker(new URL('../audio/schedulerTimer.worker.ts', import.meta.url), {
      type: 'module',
    })
    timerWorker.onmessage = scheduleClicks
  }
  return timerWorker
}

async function start(): Promise<void> {
  // Browser erlauben Ton erst nach einer Nutzer-Aktion. Deshalb entsteht der
  // AudioContext hier beim ersten Klick auf Play und nicht schon beim Laden der Seite.
  if (audioContext === null) {
    audioContext = new AudioContext()
  }
  if (audioContext.state === 'suspended') {
    await audioContext.resume()
  }

  // Kurz nach "jetzt" mit Schlag 1 beginnen
  nextBeatInMeasure = 0
  nextClickTime = audioContext.currentTime + 0.05
  scheduledClicks.length = 0
  isPlaying.value = true

  scheduleClicks()
  getTimerWorker().postMessage({ command: 'start', intervalMs: LOOKAHEAD_MS })
  animationFrameId = requestAnimationFrame(updateDisplay)
}

function stop(): void {
  // Ohne laufendes Metronom gibt es nichts zu steigern
  stopAutomation()
  if (timerWorker !== null) {
    timerWorker.postMessage({ command: 'stop' })
  }

  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId)
    animationFrameId = null
  }

  // Bereits geplante, aber noch nicht erklungene Klicks abbrechen.
  // Sonst wäre nach dem Stoppen noch ein Klick zu hören.
  for (const click of scheduledClicks) {
    try {
      click.oscillator.stop()
    } catch {
      // Oszillator war schon fertig, nichts zu tun
    }
  }
  scheduledClicks.length = 0

  isPlaying.value = false
  currentBeat.value = -1
}

function togglePlay(): void {
  if (isPlaying.value) {
    stop()
  } else {
    start()
  }
}

// ---------------------------------------------------------------------------
// 4. Automation (Tempo-Trainer)
// ---------------------------------------------------------------------------
//
// Beispiel: Start 160, Ende 190, +5 BPM alle 4 Takte
//   160 ─4 Takte─► 165 ─4 Takte─► 170 … ─► 190, dann bleibt das Tempo bei 190
//   Das sind 7 Stufen: 160, 165, 170, 175, 180, 185, 190
//
// Gezählt wird im Scheduler, denn nur der weiß, wann ein neuer Takt beginnt.

// Wurde der erste Taktanfang nach dem Start schon gesehen?
// Startet die Automation mitten im Takt, zählt dieser angebrochene Takt nicht mit.
let hasSeenFirstDownbeat = false

// Anzahl der Stufen inklusive Start und Ende
const automationTotalSteps = computed(() => {
  const { startBpm, endBpm, stepBpm } = automation.value
  return Math.ceil((endBpm - startBpm) / stepBpm) + 1
})

const measuresUntilNextStep = computed(
  () => automation.value.everyMeasures - automationMeasuresDone.value,
)

// Wird vom Scheduler an jedem Taktanfang aufgerufen
function onMeasureStart(): void {
  if (!isAutomationRunning.value) {
    return
  }
  if (!hasSeenFirstDownbeat) {
    hasSeenFirstDownbeat = true
    return
  }

  automationMeasuresDone.value = automationMeasuresDone.value + 1
  if (automationMeasuresDone.value < automation.value.everyMeasures) {
    return
  }

  // Genug Takte gespielt: nächste Stufe, aber nie über das Ziel hinaus
  automationMeasuresDone.value = 0
  automationStep.value = automationStep.value + 1
  let nextBpm = bpm.value + automation.value.stepBpm
  if (nextBpm > automation.value.endBpm) {
    nextBpm = automation.value.endBpm
  }
  applyBpm(nextBpm)

  // Ziel erreicht: Automation endet, das Metronom spielt im Ziel-Tempo weiter
  if (nextBpm >= automation.value.endBpm) {
    stopAutomation()
  }
}

function startAutomation(): void {
  const { startBpm, endBpm } = automation.value
  if (endBpm <= startBpm) {
    return
  }

  applyBpm(startBpm)
  automationStep.value = 1
  automationMeasuresDone.value = 0
  hasSeenFirstDownbeat = false
  isAutomationRunning.value = true

  if (!isPlaying.value) {
    start()
  }
}

function stopAutomation(): void {
  isAutomationRunning.value = false
}

export function useMetronome() {
  return {
    bpm,
    beatsPerMeasure,
    currentBeat,
    beatPulse,
    isPlaying,
    currentRudimentId,
    automation,
    isAutomationRunning,
    automationStep,
    automationTotalSteps,
    measuresUntilNextStep,
    setBpm,
    increaseBpm,
    decreaseBpm,
    setBeatsPerMeasure,
    increaseBeats,
    decreaseBeats,
    start,
    stop,
    togglePlay,
    startAutomation,
    stopAutomation,
    selectRudiment,
  }
}
