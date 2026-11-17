<script setup lang="ts">
// Der Übe-Bildschirm. Er setzt die Komponenten zusammen und verbindet sie
// mit dem gemeinsamen Zustand aus den Composables.
// Er selbst zeichnet fast nichts, das machen die Kindkomponenten.
import { computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { getMe } from '@/api/players'
import { ApiError } from '@/api/client'
import { MAX_BEATS, MAX_BPM, MIN_BEATS, MIN_BPM, useMetronome } from '@/composables/useMetronome'
import { useRudiments } from '@/composables/useRudiments'
import { useTapTempo } from '@/composables/useTapTempo'
import { useSessionRecorder } from '@/composables/useSessionRecorder'
import SessionStatus from '@/components/SessionStatus.vue'
import TopBar from '@/components/TopBar.vue'
import RudimentDisplay from '@/components/RudimentDisplay.vue'
import TempoDisplay from '@/components/TempoDisplay.vue'
import BeatIndicator from '@/components/BeatIndicator.vue'
import BeatsPerMeasureControl from '@/components/BeatsPerMeasureControl.vue'
import ControlBar from '@/components/ControlBar.vue'

const router = useRouter()

// Gemeinsamer Zustand. Die geschweiften Klammern holen einzelne Teile heraus.
const {
  bpm,
  beatsPerMeasure,
  currentBeat,
  beatPulse,
  isPlaying,
  currentRudimentId,
  setBpm,
  increaseBpm,
  decreaseBpm,
  increaseBeats,
  decreaseBeats,
  togglePlay,
  stop,
  selectRudiment,
} = useMetronome()

const { rudiments, errorMessage: rudimentError, loadRudiments, findRudiment } = useRudiments()

// Das aktuell gewählte Rudiment als ganzes Objekt
const currentRudiment = computed(() => findRudiment(currentRudimentId.value))

// ---------- Tap Tempo ----------
// Gleiche Logik wie im Tempo-Dialog, hier direkt auf dem Übe-Bildschirm
const { tap, tapCount } = useTapTempo()

function handleTap() {
  const tappedBpm = tap()
  if (tappedBpm !== null) {
    setBpm(tappedBpm)
  }
}

// ---------- Tastatur: Leertaste = Start/Stopp, T = Tap Tempo ----------
// Gilt auf dem ganzen Übe-Bildschirm, auch wenn gerade ein Button den Fokus hat.
// Ausnahmen: Eingabefelder (dort tippt man Leerzeichen) und offene Dialoge.
function isSpaceIgnored(event: KeyboardEvent): boolean {
  const target = event.target
  if (!(target instanceof HTMLElement)) {
    return false
  }
  return target.closest('input, textarea, select, [role="dialog"], [role="alertdialog"]') !== null
}

function handleKeydown(event: KeyboardEvent) {
  // T tippt das Tempo, ohne die Maus zu brauchen (nicht beim Tippen in Feldern)
  if (event.code === 'KeyT' && !event.repeat && !isSpaceIgnored(event)) {
    handleTap()
    return
  }
  if (event.code !== 'Space' || isSpaceIgnored(event)) {
    return
  }
  // Verhindert, dass die Seite scrollt oder ein fokussierter Button "geklickt" wird
  event.preventDefault()
  // Gedrückt gehaltene Taste löst viele keydown-Events aus. Nur das erste zählt.
  if (!event.repeat) {
    togglePlay()
  }
}

// Buttons lösen ihren Klick bei der Leertaste erst beim Loslassen aus.
// Auch das unterdrücken, sonst würde z. B. ein fokussierter ">"-Button zusätzlich das BPM ändern.
function handleKeyup(event: KeyboardEvent) {
  if (event.code === 'Space' && !isSpaceIgnored(event)) {
    event.preventDefault()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
  document.addEventListener('keyup', handleKeyup)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  document.removeEventListener('keyup', handleKeyup)
  // Verlässt man den Übe-Bildschirm (z. B. zum Onboarding), verstummt das Metronom
  stop()
})

onMounted(async () => {
  // 1. Prüfen, ob das Backend den Spieler noch kennt
  try {
    await getMe()
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      await router.replace({ name: 'welcome' })
      return
    }
    // Andere Fehler (z. B. Backend aus) zeigt unten der Rudiment-Fehler an
  }

  // 2. Rudimente laden und das erste wählen, falls noch keins gewählt ist
  await loadRudiments()
  const firstRudiment = rudiments.value[0]
  if (currentRudimentId.value === null && firstRudiment !== undefined) {
    selectRudiment(firstRudiment.id)
  }
})

// Dialog öffnen = zu seiner Route wechseln. Die Route ist eine Kind-Route,
// MetronomeView bleibt also stehen und der Dialog erscheint darüber.
function openRudimentSelection() {
  router.push({ name: 'rudiments' })
}

function openSessions() {
  router.push({ name: 'sessions' })
}

function openLeaderboard() {
  router.push({ name: 'leaderboard' })
}

function openTempoSettings() {
  router.push({ name: 'tempo' })
}

// ---------- Session-Recorder ----------
// Der Recorder zeichnet ab dem ersten Play automatisch auf (siehe useSessionRecorder.ts)
const { hasSession, sessionSeconds, rudimentCount } = useSessionRecorder()

// "Send Session": Metronom anhalten und das vorausgefüllte Formular öffnen.
// ?source=recording sagt dem Formular, dass es die Aufnahme übernehmen soll.
function sendSession() {
  stop()
  router.push({ name: 'session-new', query: { source: 'recording' } })
}
</script>

<template>
  <div class="metronome-page">
    <TopBar>
      <SessionStatus
        v-if="hasSession"
        :session-seconds="sessionSeconds"
        :rudiment-count="rudimentCount"
      />
    </TopBar>

    <main class="metronome-main container">
      <div v-if="rudimentError" class="alert alert-danger" role="alert">
        {{ rudimentError }}
      </div>

      <div class="row align-items-center gy-4 gy-lg-0">
        <div class="col-12 col-lg-6">
          <RudimentDisplay :rudiment="currentRudiment" @select="openRudimentSelection" />
        </div>

        <div class="col-12 col-lg-6 d-flex flex-column align-items-center gap-4">
          <TempoDisplay
            :bpm="bpm"
            :min-bpm="MIN_BPM"
            :max-bpm="MAX_BPM"
            @decrease="decreaseBpm"
            @increase="increaseBpm"
            @change="setBpm"
            @open="openTempoSettings"
          />
          <BeatsPerMeasureControl
            :beats-per-measure="beatsPerMeasure"
            :min="MIN_BEATS"
            :max="MAX_BEATS"
            @decrease="decreaseBeats"
            @increase="increaseBeats"
          >
            <BeatIndicator
              :beats-per-measure="beatsPerMeasure"
              :current-beat="currentBeat"
              :pulse="beatPulse"
            />
          </BeatsPerMeasureControl>
          <button
            type="button"
            class="btn btn-secondary tap-button"
            aria-keyshortcuts="T"
            @click="handleTap"
          >
            {{ tapCount === 1 ? 'Keep tapping…' : 'Tap tempo' }}
          </button>
        </div>
      </div>
    </main>

    <!-- Hier erscheint der Dialog der aktuellen Kind-Route, z. B. /rudiments.
         Auf "/" selbst gibt es keine Kind-Route, dann bleibt die Stelle leer. -->
    <RouterView />

    <ControlBar
      class="metronome-controls"
      :is-playing="isPlaying"
      :can-send-session="hasSession"
      @open-leaderboard="openLeaderboard"
      @open-sessions="openSessions"
      @toggle-play="togglePlay"
      @send-session="sendSession"
    />
  </div>
</template>

<style scoped>
/* Seite als Spalte: TopBar oben, Inhalt füllt die Mitte, Steuerleiste unten */
.metronome-page {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
}

.metronome-main {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding-block: 1rem;
}

/* Ab Tablet-Querformat: Die Seite ist genau so hoch wie das Fenster.
   Die Inhalte skalieren über vh-Werte mit (siehe RudimentDisplay, TempoDisplay,
   BeatIndicator, PlayButton), statt dass die Seite scrollt. */
@media (min-width: 992px) {
  .metronome-page {
    height: 100dvh;
  }

  .metronome-main {
    min-height: 0;
  }
}

/* Feste Breite: Der Text wechselt zu "Keep tapping…", der Button soll dabei nicht springen */
.tap-button {
  min-width: 9.5rem;
}

/* Am Handy bleibt die Steuerleiste beim Scrollen unten sichtbar */
.metronome-controls {
  position: sticky;
  bottom: 0;
  background-color: var(--dt-bg);
}
</style>
