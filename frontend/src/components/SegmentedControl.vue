<script setup lang="ts" generic="T extends string">
// Umschalter mit mehreren Optionen, von denen genau eine aktiv ist,
// z. B. "Best BPM | Practice time" oder "Week | Month | All time".
//
// generic="T extends string": Die Komponente funktioniert mit jeder Art von Text-Werten.
// Bei den Metriken ist T = 'bpm' | 'duration', bei den Zeiträumen 'week' | 'month' | 'all'.
// So prüft TypeScript, dass nur erlaubte Werte hineinkommen.

const model = defineModel<T>({ required: true })

defineProps<{
  options: { value: T; label: string }[]
  // Beschreibung für Screenreader, z. B. "Metric"
  label: string
}>()
</script>

<template>
  <div class="segmented" role="group" :aria-label="label">
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      class="segment"
      :class="{ 'is-active': option.value === model }"
      :aria-pressed="option.value === model"
      @click="model = option.value"
    >
      {{ option.label }}
    </button>
  </div>
</template>

<style scoped>
.segmented {
  display: inline-flex;
  gap: 0.25rem;
  padding: 0.25rem;
  border-radius: var(--dt-radius-button);
  background-color: var(--dt-surface-2);
}

.segment {
  padding: 0.5rem 1rem;
  border: 0;
  border-radius: calc(var(--dt-radius-button) - 0.25rem);
  background: none;
  color: var(--dt-text-muted);
  font-weight: 500;
  white-space: nowrap;
  transition:
    background-color 0.15s,
    color 0.15s;
}

.segment:hover:not(.is-active) {
  color: var(--dt-text);
}

.segment.is-active {
  background-color: var(--dt-accent);
  color: var(--dt-on-accent);
}
</style>
