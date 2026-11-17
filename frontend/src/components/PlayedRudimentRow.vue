<script setup lang="ts">
// Eine Zeile im Session-Formular: Rudiment, BPM, Dauer, Löschen.
//
// defineModel() erzeugt eine Zwei-Wege-Verbindung zur Elternkomponente.
// Die Eltern schreiben z. B. v-model:bpm="row.bpm". Tippt jemand in das BPM-Feld,
// ändert sich row.bpm in der Elternkomponente direkt mit.
import { useId } from 'vue'
import type { Rudiment } from '@/types'
import { useDragAdjust } from '@/composables/useDragAdjust'
import { MAX_BPM, MIN_BPM } from '@/composables/useMetronome'
import { parseDuration, toDurationText } from '@/utils/duration'
import AppIcon from './AppIcon.vue'

const rudimentId = defineModel<string>('rudimentId', { required: true })
const bpm = defineModel<number | null>('bpm', { required: true })
const durationText = defineModel<string>('durationText', { required: true })

defineProps<{
  rudiments: Rudiment[]
  // Welche Felder sind ungültig? Die Eltern prüfen, die Zeile färbt nur rot.
  invalidRudiment: boolean
  invalidBpm: boolean
  invalidDuration: boolean
  canRemove: boolean
}>()

const emit = defineEmits<{
  remove: []
}>()

// Eindeutige ids, damit die versteckten Labels zu den Feldern passen
const fieldId = useId()

// ---------- Werte per Ziehen ändern ----------

// Startwert fürs Ziehen. Ist das Feld leer, starten wir bei 120.
function getBpmForDrag(): number {
  if (typeof bpm.value === 'number') {
    return bpm.value
  }
  return 120
}

// Neuer Wert beim Ziehen, im erlaubten Bereich gehalten
function setBpmFromDrag(value: number) {
  if (value < MIN_BPM) {
    bpm.value = MIN_BPM
  } else if (value > MAX_BPM) {
    bpm.value = MAX_BPM
  } else {
    bpm.value = value
  }
}

// Dauer im Feld als Sekunden. Unlesbarer Text zählt als 0.
function currentDurationSeconds(): number {
  const seconds = parseDuration(durationText.value)
  if (seconds === null) {
    return 0
  }
  return seconds
}

// BPM: 1 BPM pro 10 Pixel, im erlaubten Bereich
const bpmDrag = useDragAdjust({
  getValue: getBpmForDrag,
  setValue: setBpmFromDrag,
  step: 1,
  pixelsPerStep: 10,
})

// Dauer: 10 Sekunden pro 6 Pixel, nie unter 0
const DURATION_STEP = 10

function changeDuration(seconds: number) {
  // Nie unter 0
  if (seconds < 0) {
    seconds = 0
  }
  durationText.value = toDurationText(seconds)
}

const durationDrag = useDragAdjust({
  getValue: currentDurationSeconds,
  setValue: changeDuration,
  step: DURATION_STEP,
  pixelsPerStep: 6,
})

// Tastatur im Dauer-Feld: Pfeil hoch/runter ändert um DURATION_STEP Sekunden.
// Das BPM-Feld (type="number") kann das schon von selbst.
function handleDurationKeydown(event: KeyboardEvent) {
  const current = currentDurationSeconds()
  if (event.key === 'ArrowUp') {
    event.preventDefault()
    changeDuration(current + DURATION_STEP)
  } else if (event.key === 'ArrowDown') {
    event.preventDefault()
    changeDuration(current - DURATION_STEP)
  }
}
</script>

<template>
  <div class="played-row">
    <label :for="`${fieldId}-rudiment`" class="visually-hidden">Rudiment</label>
    <select
      :id="`${fieldId}-rudiment`"
      v-model="rudimentId"
      class="form-select row-rudiment"
      :class="{ 'is-invalid': invalidRudiment }"
    >
      <option value="" disabled>Choose rudiment</option>
      <option v-for="rudiment in rudiments" :key="rudiment.id" :value="rudiment.id">
        {{ rudiment.name }}
      </option>
    </select>

    <div class="unit-field drag-adjustable" @pointerdown="bpmDrag.onPointerDown">
      <label :for="`${fieldId}-bpm`" class="visually-hidden">Tempo in BPM</label>
      <!-- v-model.number wandelt die Eingabe in eine Zahl um. Leeres Feld ergibt "". -->
      <input
        :id="`${fieldId}-bpm`"
        v-model.number="bpm"
        type="number"
        inputmode="numeric"
        min="20"
        max="400"
        class="form-control"
        :class="{ 'is-invalid': invalidBpm }"
      />
      <span class="unit" aria-hidden="true">BPM</span>
    </div>

    <div class="unit-field drag-adjustable" @pointerdown="durationDrag.onPointerDown">
      <label :for="`${fieldId}-duration`" class="visually-hidden">Duration (minutes:seconds)</label>
      <input
        :id="`${fieldId}-duration`"
        v-model="durationText"
        type="text"
        inputmode="numeric"
        placeholder="5:00"
        class="form-control"
        :class="{ 'is-invalid': invalidDuration }"
        @keydown="handleDurationKeydown"
      />
      <span class="unit" aria-hidden="true">min</span>
    </div>

    <button
      type="button"
      class="remove-button"
      aria-label="Remove rudiment"
      :disabled="!canRemove"
      @click="emit('remove')"
    >
      <AppIcon name="trash" :size="22" />
    </button>
  </div>
</template>

<style scoped>
.played-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border-radius: var(--dt-radius-card);
  background-color: var(--dt-surface-2);
}

.row-rudiment {
  flex-grow: 1;
  min-width: 0;
  background-color: transparent;
  border-color: transparent;
  font-size: var(--dt-font-body-l);
}

/* Eingabefeld mit Einheit dahinter, z. B. "128 BPM" */
.unit-field {
  position: relative;
  flex-shrink: 0;
  width: 7.5rem;
}

/* Pfeil-Cursor zeigt: Hier lässt sich ziehen. Ein Klick fokussiert trotzdem zum Tippen. */
.unit-field .form-control {
  cursor: ns-resize;
  padding-right: 3rem;
  background-color: var(--dt-surface-3);
  border-color: transparent;
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.unit-field .form-control.is-invalid {
  border-color: var(--bs-form-invalid-border-color);
}

.unit {
  position: absolute;
  top: 50%;
  right: 0.75rem;
  transform: translateY(-50%);
  font-size: var(--dt-font-caption);
  color: var(--dt-text-muted);
  pointer-events: none;
}

.remove-button {
  display: flex;
  flex-shrink: 0;
  padding: 0.5rem;
  border: 0;
  border-radius: 50%;
  background: none;
  color: var(--dt-text);
}

.remove-button:hover:not(:disabled) {
  background-color: var(--dt-surface-3);
  color: var(--bs-danger);
}

.remove-button:disabled {
  opacity: 0.3;
}

/* Handy: Rudiment oben über die ganze Breite, Werte darunter */
@media (max-width: 575.98px) {
  .played-row {
    flex-wrap: wrap;
  }

  .row-rudiment {
    flex-basis: 100%;
  }

  .unit-field {
    flex: 1 1 0;
    width: auto;
  }
}
</style>
