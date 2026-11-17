<script setup lang="ts">
// Dialog "Tempo" unter /tempo.
// Oben: BPM, Tap Tempo, Schläge pro Takt. Alles wirkt sofort auf das Metronom.
// Unten: Einstellungen der Automation und Start.
import { computed } from 'vue'
import { MAX_BEATS, MAX_BPM, MIN_BEATS, MIN_BPM, useMetronome } from '@/composables/useMetronome'
import { useTapTempo } from '@/composables/useTapTempo'
import { useCloseDialog } from '@/composables/useCloseDialog'
import AppDialog from '@/components/AppDialog.vue'
import AppIcon from '@/components/AppIcon.vue'
import TempoDisplay from '@/components/TempoDisplay.vue'
import BeatsPerMeasureControl from '@/components/BeatsPerMeasureControl.vue'
import BeatIndicator from '@/components/BeatIndicator.vue'
import PickerColumn from '@/components/PickerColumn.vue'

const {
  bpm,
  beatsPerMeasure,
  currentBeat,
  beatPulse,
  automation,
  isAutomationRunning,
  startAutomation,
  setBpm,
  increaseBpm,
  decreaseBpm,
  increaseBeats,
  decreaseBeats,
} = useMetronome()

const { closeDialog } = useCloseDialog()

// ---------- Tap Tempo ----------
const { tap, tapCount } = useTapTempo()

function handleTap() {
  const tappedBpm = tap()
  // Ab dem zweiten Tap gibt es ein Ergebnis. setBpm rundet und begrenzt.
  if (tappedBpm !== null) {
    setBpm(tappedBpm)
  }
}

const tapLabel = computed(() => {
  if (tapCount.value === 1) {
    return 'Keep tapping…'
  }
  return 'Tap tempo'
})

// ---------- Automation ----------
// Startet die Automation und schließt den Dialog. Auf dem Übe-Bildschirm
// zeigt dann AutomationStatus den Fortschritt.
function handleStartAutomation() {
  startAutomation()
  closeDialog()
}

// Das Ziel muss über dem Start liegen, sonst gibt es nichts zu steigern
const automationProblem = computed(() => {
  if (automation.value.endBpm <= automation.value.startBpm) {
    return 'End must be higher than start.'
  }
  return ''
})
</script>

<template>
  <AppDialog title="Tempo">
    <div class="tempo-content">
      <section class="tempo-main" aria-label="Tempo and measure">
        <!-- Die gleiche Komponente wie im Hauptfenster. Ein Klick auf die Zahl
             würde den Dialog nochmal öffnen, deshalb ohne @open. -->
        <TempoDisplay
          :bpm="bpm"
          :min-bpm="MIN_BPM"
          :max-bpm="MAX_BPM"
          @decrease="decreaseBpm"
          @increase="increaseBpm"
          @change="setBpm"
        />

        <button type="button" class="btn btn-secondary tap-button" @click="handleTap">
          {{ tapLabel }}
        </button>

        <div class="beats-block">
          <span class="field-label">Beats per measure</span>
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
        </div>
      </section>

      <hr />

      <section aria-labelledby="automation-heading">
        <h3 id="automation-heading" class="automation-heading">
          <AppIcon name="zap" :size="22" />
          Automation
        </h3>
        <p class="text-secondary">Changes the tempo step by step over time</p>

        <div class="row row-cols-2 row-cols-sm-4 g-2 g-sm-3">
          <div class="col">
            <PickerColumn
              v-model="automation.startBpm"
              label="Start"
              unit="BPM"
              :min="MIN_BPM"
              :max="MAX_BPM"
            />
          </div>
          <div class="col">
            <PickerColumn
              v-model="automation.endBpm"
              label="End"
              unit="BPM"
              :min="MIN_BPM"
              :max="MAX_BPM"
            />
          </div>
          <div class="col">
            <PickerColumn
              v-model="automation.stepBpm"
              label="Increment"
              unit="BPM"
              :min="1"
              :max="50"
              show-plus
            />
          </div>
          <div class="col">
            <PickerColumn
              v-model="automation.everyMeasures"
              label="Every"
              unit="meas."
              :min="1"
              :max="32"
            />
          </div>
        </div>

        <p v-if="automationProblem" class="text-danger mt-3 mb-0" role="alert">
          {{ automationProblem }}
        </p>
      </section>

      <div class="dialog-actions">
        <button type="button" class="btn btn-secondary btn-lg" @click="closeDialog">Done</button>
        <button
          type="button"
          class="btn btn-primary btn-lg"
          :disabled="automationProblem !== ''"
          @click="handleStartAutomation"
        >
          {{ isAutomationRunning ? 'Restart automation' : 'Start automation' }}
        </button>
      </div>
    </div>
  </AppDialog>
</template>

<style scoped>
.tempo-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.tempo-main {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.25rem;
}

/* Im Dialog etwas kleiner als im Hauptfenster */
.tempo-main :deep(.bpm-number) {
  font-size: clamp(3.5rem, 10vh, 5.5rem);
}

.tap-button {
  min-width: 10rem;
}

.beats-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

hr {
  margin: 0;
  border-color: var(--dt-border);
  opacity: 1;
}

.automation-heading {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
  font-size: var(--dt-font-h2);
}

.automation-heading :deep(svg) {
  color: var(--dt-accent);
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

@media (max-width: 575.98px) {
  .dialog-actions .btn {
    flex: 1;
  }
}
</style>
