<script setup lang="ts">
// Filterleiste des Leaderboards:
// Rudiment-Wechsler (< Name >), Metrik und Zeitraum.
// Metrik und Zeitraum hält die Elternkomponente per v-model.
import type { Metric, Period } from '@/types'
import AppIcon from './AppIcon.vue'
import SegmentedControl from './SegmentedControl.vue'

const metric = defineModel<Metric>('metric', { required: true })
const period = defineModel<Period>('period', { required: true })

defineProps<{
  rudimentLabel: string
}>()

const emit = defineEmits<{
  previousRudiment: []
  nextRudiment: []
}>()

const metricOptions: { value: Metric; label: string }[] = [
  { value: 'bpm', label: 'Best BPM' },
  { value: 'duration', label: 'Practice time' },
]

const periodOptions: { value: Period; label: string }[] = [
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'all', label: 'All time' },
]
</script>

<template>
  <div class="leaderboard-filter">
    <!-- Obere Zeile: Rudiment-Wechsler links, rechts Platz für Buttons der Elternkomponente -->
    <div class="filter-top">
      <div class="rudiment-switcher">
        <button
          type="button"
          class="switch-button"
          aria-label="Previous rudiment"
          @click="emit('previousRudiment')"
        >
          <AppIcon name="chevron-left" :size="20" />
        </button>
        <!-- aria-live: Screenreader lesen das neue Rudiment nach dem Wechsel vor -->
        <span class="rudiment-label" aria-live="polite">{{ rudimentLabel }}</span>
        <button
          type="button"
          class="switch-button"
          aria-label="Next rudiment"
          @click="emit('nextRudiment')"
        >
          <AppIcon name="chevron-right" :size="20" />
        </button>
      </div>
      <!-- Benannter Slot: Der Dialog setzt hier den Button "Add Friend" ein -->
      <slot name="actions" />
    </div>

    <!-- Untere Zeile über die ganze Breite: Metrik links, Zeitraum rechts -->
    <div class="segments">
      <SegmentedControl v-model="metric" :options="metricOptions" label="Metric" />
      <SegmentedControl v-model="period" :options="periodOptions" label="Time period" />
    </div>
  </div>
</template>

<style scoped>
.leaderboard-filter {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.filter-top {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.rudiment-switcher {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.375rem;
  border-radius: 999px;
  background-color: var(--dt-surface-2);
}

.rudiment-label {
  min-width: 11rem;
  text-align: center;
  font-weight: 500;
}

.switch-button {
  display: flex;
  padding: 0.5rem;
  border: 0;
  border-radius: 50%;
  background: none;
  color: var(--dt-text);
}

.switch-button:hover {
  background-color: var(--dt-surface-3);
}

.segments {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 0.75rem;
}
</style>
