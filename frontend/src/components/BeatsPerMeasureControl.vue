<script setup lang="ts">
// − und + um einen beliebigen Inhalt herum. Ändert die Schläge pro Takt.
// Auf dem Übe-Bildschirm steht in der Mitte der BeatIndicator,
// im Tempo-Dialog später z. B. eine Zahl. Dafür ist der <slot> da.
import AppIcon from './AppIcon.vue'

defineProps<{
  beatsPerMeasure: number
  min: number
  max: number
}>()

const emit = defineEmits<{
  decrease: []
  increase: []
}>()
</script>

<template>
  <div class="beats-control">
    <button
      type="button"
      class="beats-step"
      aria-label="Fewer beats per measure"
      :disabled="beatsPerMeasure <= min"
      @click="emit('decrease')"
    >
      <AppIcon name="minus" :size="20" />
    </button>

    <slot />

    <button
      type="button"
      class="beats-step"
      aria-label="More beats per measure"
      :disabled="beatsPerMeasure >= max"
      @click="emit('increase')"
    >
      <AppIcon name="plus" :size="20" />
    </button>

    <!-- Für Screenreader: liest die neue Zahl vor, sobald sie sich ändert -->
    <span class="visually-hidden" aria-live="polite">{{ beatsPerMeasure }} beats per measure</span>
  </div>
</template>

<style scoped>
.beats-control {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}

.beats-step {
  display: flex;
  flex-shrink: 0;
  padding: 0.5rem;
  border: 0;
  border-radius: 50%;
  background: none;
  color: var(--dt-text-muted);
}

.beats-step:hover:not(:disabled) {
  color: var(--dt-text);
  background-color: var(--dt-surface);
}

.beats-step:disabled {
  opacity: 0.3;
}
</style>
