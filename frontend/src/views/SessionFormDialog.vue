<script setup lang="ts">
// Ein Formular für drei Fälle:
//   /sessions/new                    → Session nachtragen (leeres Formular)
//   /sessions/new?source=recording   → "Session summary": Aufnahme vom Üben übernehmen
//   /sessions/:id/edit               → Session bearbeiten (gespeicherte Werte)
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { createSession, getSession, updateSession } from '@/api/sessions'
import { MAX_BPM, MIN_BPM, useMetronome } from '@/composables/useMetronome'
import { useRudiments } from '@/composables/useRudiments'
import { useCloseDialog } from '@/composables/useCloseDialog'
import { useSessionRecorder } from '@/composables/useSessionRecorder'
import {
  combineDateAndTime,
  parseDuration,
  toDateInputValue,
  toDurationText,
  toTimeInputValue,
} from '@/utils/duration'
import { formatTimer } from '@/utils/format'
import type { PlayedRudiment, SessionInput } from '@/types'
import AppDialog from '@/components/AppDialog.vue'
import StatTile from '@/components/StatTile.vue'
import PlayedRudimentRow from '@/components/PlayedRudimentRow.vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import ErrorAlert from '@/components/ErrorAlert.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'

// Kommt aus der URL /sessions/:sessionId/edit (router: props: true).
// Fehlt sie, legt das Formular eine neue Session an.
const props = defineProps<{
  sessionId?: string
}>()

const route = useRoute()
const router = useRouter()

const isEditMode = computed(() => props.sessionId !== undefined)
// Kommt das Formular von "Send Session"? Dann übernimmt es die Aufnahme.
const isRecordingMode = computed(() => !isEditMode.value && route.query.source === 'recording')

const dialogTitle = computed(() => {
  if (isEditMode.value) {
    return 'Edit session'
  }
  if (isRecordingMode.value) {
    return 'Session summary'
  }
  return 'Add past session'
})

const { buildSummary, resetRecording } = useSessionRecorder()
const { closeDialog } = useCloseDialog()
const { bpm: metronomeBpm, currentRudimentId } = useMetronome()
const { rudiments, isLoading: rudimentsLoading, loadRudiments } = useRudiments()

// ---------- Formularwerte ----------

// Bauplan für eine Zeile im Formular. Anders als PlayedRudiment:
// - key: eindeutige Nummer für v-for, auch wenn Zeilen gelöscht werden
// - bpm darf null sein (leeres Feld)
// - Dauer als Text, so wie im Feld eingetippt, z. B. "8:00"
interface PlayedRudimentDraft {
  key: number
  rudimentId: string
  bpm: number | null
  durationText: string
}

const now = new Date()
const dateText = ref(toDateInputValue(now))
const startTimeText = ref(toTimeInputValue(now))
// Leer heißt: Session dauert genau so lange wie die Übezeit
const sessionLengthText = ref('')
const rows = ref<PlayedRudimentDraft[]>([])

let nextRowKey = 1

// Neue Zeile mit dem aktuellen Rudiment und Tempo des Metronoms
function addRow() {
  const firstRudiment = rudiments.value[0]
  let rudimentId = ''
  if (currentRudimentId.value !== null) {
    rudimentId = currentRudimentId.value
  } else if (firstRudiment !== undefined) {
    rudimentId = firstRudiment.id
  }

  rows.value.push({
    key: nextRowKey,
    rudimentId: rudimentId,
    bpm: metronomeBpm.value,
    durationText: '5:00',
  })
  nextRowKey = nextRowKey + 1
}

function removeRow(key: number) {
  rows.value = rows.value.filter((row) => row.key !== key)
}

// Überträgt fertige Werte in die Formularfelder.
// Genutzt beim Bearbeiten (gespeicherte Session) und bei der Aufnahme.
function fillForm(start: Date, durationSeconds: number, playedRudiments: PlayedRudiment[]) {
  dateText.value = toDateInputValue(start)
  startTimeText.value = toTimeInputValue(start)
  sessionLengthText.value = toDurationText(durationSeconds)

  rows.value = []
  for (const played of playedRudiments) {
    rows.value.push({
      key: nextRowKey,
      rudimentId: played.rudimentId,
      bpm: played.bpm,
      durationText: toDurationText(played.durationSeconds),
    })
    nextRowKey = nextRowKey + 1
  }
}

// ---------- Bestehende Session laden (nur beim Bearbeiten) ----------

const isLoadingSession = ref(false)
const loadError = ref('')

async function loadExistingSession(sessionId: string) {
  isLoadingSession.value = true
  loadError.value = ''
  try {
    const session = await getSession(sessionId)
    fillForm(new Date(session.date), session.durationSeconds, session.playedRudiments)
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : 'Could not load the session.'
  } finally {
    isLoadingSession.value = false
  }
}

onMounted(async () => {
  await loadRudiments()
  if (props.sessionId !== undefined) {
    await loadExistingSession(props.sessionId)
  } else if (isRecordingMode.value) {
    // Aufnahme übernehmen. Alles bleibt vor dem Speichern korrigierbar.
    const summary = buildSummary()
    if (summary !== null) {
      fillForm(summary.startDate, summary.durationSeconds, summary.playedRudiments)
    }
  }
  // Keine Zeile da (neues Formular oder nur sehr kurz gespielt): eine Startzeile
  if (rows.value.length === 0) {
    addRow()
  }
})

// ---------- Abgeleitete Werte (für Kacheln und Prüfung) ----------

// Übezeit = Summe aller gültigen Zeilen-Dauern
const practiceSeconds = computed(() => {
  let total = 0
  for (const row of rows.value) {
    const seconds = parseDuration(row.durationText)
    if (seconds !== null) {
      total = total + seconds
    }
  }
  return total
})

// Gesamtdauer: eigener Wert oder, wenn leer, die Übezeit. null = ungültige Eingabe
const sessionSeconds = computed(() => {
  if (sessionLengthText.value.trim() === '') {
    return practiceSeconds.value
  }
  return parseDuration(sessionLengthText.value)
})

const startDate = computed(() => combineDateAndTime(dateText.value, startTimeText.value))

// ---------- Prüfung ----------
// Die gleichen Regeln wie im Backend. So sieht der Nutzer Fehler sofort am Feld,
// und das Backend prüft trotzdem nochmal, falls jemand das Frontend umgeht.

function isValidBpm(value: number | string | null): boolean {
  // Ein leeres Zahlenfeld liefert mit v-model.number einen leeren Text
  return (
    typeof value === 'number' && Number.isInteger(value) && value >= MIN_BPM && value <= MAX_BPM
  )
}

function isValidDuration(text: string): boolean {
  const seconds = parseDuration(text)
  return seconds !== null && seconds > 0
}

// Erst nach dem ersten Klick auf "Save" rot färben, nicht schon beim Tippen
const showErrors = ref(false)

// Liste aller Probleme als Text. Leer = Formular gültig.
const problems = computed(() => {
  const result: string[] = []

  if (rows.value.length === 0) {
    result.push('Add at least one rudiment.')
  }
  for (const row of rows.value) {
    if (row.rudimentId === '' || !isValidBpm(row.bpm) || !isValidDuration(row.durationText)) {
      result.push(
        `Every rudiment needs a tempo between ${MIN_BPM} and ${MAX_BPM} BPM and a duration like 5:00.`,
      )
      break
    }
  }
  if (startDate.value === null) {
    result.push('Enter a valid date and start time.')
  } else if (startDate.value > new Date()) {
    result.push('The session cannot start in the future.')
  }
  if (sessionSeconds.value === null) {
    result.push('Enter the session length like 26:10.')
  } else if (practiceSeconds.value > sessionSeconds.value) {
    result.push('Practice time must not exceed the session time.')
  }

  return result
})

// ---------- Verwerfen ----------
// Beim Nachtragen und Bearbeiten schließt "Discard" einfach das Formular.
// Bei einer Aufnahme geht dabei die Übezeit verloren, deshalb vorher nachfragen.
const isConfirmingDiscard = ref(false)

function handleDiscard() {
  if (isRecordingMode.value) {
    isConfirmingDiscard.value = true
  } else {
    closeDialog()
  }
}

function confirmDiscard() {
  isConfirmingDiscard.value = false
  resetRecording()
  closeDialog()
}

// ---------- Speichern ----------

const isSaving = ref(false)
const saveError = ref('')

async function handleSave() {
  showErrors.value = true
  saveError.value = ''
  if (problems.value.length > 0 || startDate.value === null || sessionSeconds.value === null) {
    return
  }

  // Formularwerte in das Format der API umbauen
  const input: SessionInput = {
    date: startDate.value.toISOString(),
    durationSeconds: sessionSeconds.value,
    playedRudiments: rows.value.map((row) => ({
      rudimentId: row.rudimentId,
      bpm: Number(row.bpm),
      durationSeconds: parseDuration(row.durationText) ?? 0,
    })),
  }

  isSaving.value = true
  try {
    if (props.sessionId !== undefined) {
      await updateSession(props.sessionId, input)
    } else {
      await createSession(input)
    }

    // Aufnahme gespeichert: Recorder leeren, zurück zum Übe-Bildschirm
    if (isRecordingMode.value) {
      resetRecording()
      closeDialog()
      return
    }

    // Zurück zur Liste. Sie lädt beim Öffnen neu und zeigt die neue Session.
    // Kam man aus der Liste, geht es per back() dorthin zurück (kein doppelter
    // Eintrag im Verlauf). Wurde /sessions/new direkt geöffnet, per replace.
    if (window.history.state?.back) {
      router.back()
    } else {
      await router.replace({ name: 'sessions' })
    }
  } catch (error) {
    saveError.value = error instanceof Error ? error.message : 'Could not save the session.'
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <AppDialog :title="dialogTitle" size="lg">
    <LoadingSpinner v-if="(rudimentsLoading && rudiments.length === 0) || isLoadingSession" />

    <ErrorAlert
      v-else-if="loadError && sessionId"
      :message="loadError"
      show-retry
      @retry="loadExistingSession(sessionId)"
    />

    <!-- novalidate: Wir prüfen selbst, nicht der Browser -->
    <form v-else novalidate class="session-form" @submit.prevent="handleSave">
      <div class="row row-cols-2 g-2 g-sm-3">
        <div class="col">
          <StatTile
            :value="sessionSeconds === null ? '–' : formatTimer(sessionSeconds)"
            label="Session time"
          />
        </div>
        <div class="col">
          <StatTile :value="formatTimer(practiceSeconds)" label="Practice time" />
        </div>
      </div>

      <div class="row g-3">
        <div class="col-6 col-sm-4">
          <label for="session-date" class="form-label field-label">Date</label>
          <input
            id="session-date"
            v-model="dateText"
            type="date"
            class="form-control form-control-lg"
            :max="toDateInputValue(new Date())"
            :class="{ 'is-invalid': showErrors && startDate === null }"
          />
        </div>
        <div class="col-6 col-sm-4">
          <label for="session-start" class="form-label field-label">Start</label>
          <input
            id="session-start"
            v-model="startTimeText"
            type="time"
            class="form-control form-control-lg"
            :class="{ 'is-invalid': showErrors && startDate === null }"
          />
        </div>
        <div class="col-12 col-sm-4">
          <label for="session-length" class="form-label field-label">Session length</label>
          <input
            id="session-length"
            v-model="sessionLengthText"
            type="text"
            inputmode="numeric"
            class="form-control form-control-lg"
            :placeholder="formatTimer(practiceSeconds)"
            aria-describedby="session-length-hint"
            :class="{ 'is-invalid': showErrors && sessionSeconds === null }"
          />
          <div id="session-length-hint" class="form-text">Empty = practice time</div>
        </div>
      </div>

      <fieldset>
        <legend class="field-label mb-2">Played rudiments</legend>
        <div class="d-flex flex-column gap-2">
          <PlayedRudimentRow
            v-for="row in rows"
            :key="row.key"
            v-model:rudiment-id="row.rudimentId"
            v-model:bpm="row.bpm"
            v-model:duration-text="row.durationText"
            :rudiments="rudiments"
            :invalid-rudiment="showErrors && row.rudimentId === ''"
            :invalid-bpm="showErrors && !isValidBpm(row.bpm)"
            :invalid-duration="showErrors && !isValidDuration(row.durationText)"
            :can-remove="rows.length > 1"
            @remove="removeRow(row.key)"
          />
        </div>
        <button type="button" class="btn btn-outline-secondary mt-3" @click="addRow">
          + Add rudiment
        </button>
      </fieldset>

      <!-- Probleme aus der eigenen Prüfung, erst nach dem ersten Speichern-Versuch -->
      <div v-if="showErrors && problems.length > 0" class="alert alert-danger mb-0" role="alert">
        <ul class="mb-0 ps-3">
          <li v-for="problem in problems" :key="problem">{{ problem }}</li>
        </ul>
      </div>

      <!-- Fehler vom Backend, z. B. Server nicht erreichbar -->
      <div v-if="saveError" class="alert alert-danger mb-0" role="alert">{{ saveError }}</div>

      <p class="form-text m-0">
        Check the values before saving. Practice time must not exceed the session time. Tip: drag
        BPM or minutes up or down to change them.
      </p>

      <div class="form-actions">
        <button
          type="button"
          class="btn btn-secondary btn-lg"
          :disabled="isSaving"
          @click="handleDiscard"
        >
          Discard
        </button>
        <button type="submit" class="btn btn-primary btn-lg" :disabled="isSaving">
          <span
            v-if="isSaving"
            class="spinner-border spinner-border-sm me-2"
            aria-hidden="true"
          ></span>
          Save session
        </button>
      </div>
    </form>

    <ConfirmDialog
      v-if="isConfirmingDiscard"
      title="Discard session?"
      message="Your recorded practice time will be lost. You cannot undo this."
      confirm-label="Discard"
      @confirm="confirmDiscard"
      @cancel="isConfirmingDiscard = false"
    />
  </AppDialog>
</template>

<style scoped>
.session-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

fieldset {
  margin: 0;
  padding: 0;
  border: 0;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

@media (max-width: 575.98px) {
  .form-actions .btn {
    flex: 1;
  }
}
</style>
