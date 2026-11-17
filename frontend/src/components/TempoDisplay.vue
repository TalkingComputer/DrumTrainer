<script setup lang="ts">
// Große BPM-Anzeige mit < und > zum Ändern.
// Ein Klick auf die Zahl meldet "open". Die Elternkomponente öffnet dann den Tempo-Dialog.
// Ziehen auf der Zahl ändert das Tempo direkt und meldet "change".
import { useDragAdjust } from '@/composables/useDragAdjust'
import AppIcon from './AppIcon.vue'

const props = defineProps<{
  bpm: number
  minBpm: number
  maxBpm: number
}>()

const emit = defineEmits<{
  decrease: []
  increase: []
  open: []
  change: [bpm: number]
}>()

// 1 BPM pro 4 Pixel. Den erlaubten Bereich prüft setBpm() in useMetronome.
const drag = useDragAdjust({
  getValue: () => props.bpm,
  setValue: (value) => emit('change', value),
  step: 1,
  pixelsPerStep: 10,
})

// Nach einem Ziehen löst das Loslassen auch einen Klick aus.
// Den ignorieren wir, sonst öffnet sich der Tempo-Dialog.
function handleValueClick() {
  if (drag.wasJustDragged()) {
    return
  }
  emit('open')
}

// Tastatur: Pfeil hoch/runter auf der fokussierten Zahl ändert das Tempo
function handleValueKeydown(event: KeyboardEvent) {
  if (event.key === 'ArrowUp') {
    event.preventDefault()
    emit('increase')
  } else if (event.key === 'ArrowDown') {
    event.preventDefault()
    emit('decrease')
  }
}
</script>

<template>
  <div class="tempo-display">
    <button
      type="button"
      class="tempo-step"
      aria-label="Decrease tempo"
      :disabled="bpm <= minBpm"
      @click="emit('decrease')"
    >
      <AppIcon name="chevron-left" :size="32" />
    </button>

    <button
      type="button"
      class="tempo-value drag-adjustable"
      :aria-label="`${bpm} BPM. Drag or use arrow keys to change. Click for tempo settings`"
      @pointerdown="drag.onPointerDown"
      @click="handleValueClick"
      @keydown="handleValueKeydown"
    >
      <span class="bpm-number">{{ bpm }}</span>
      <span class="bpm-unit">BPM</span>
    </button>

    <button
      type="button"
      class="tempo-step"
      aria-label="Increase tempo"
      :disabled="bpm >= maxBpm"
      @click="emit('increase')"
    >
      <AppIcon name="chevron-right" :size="32" />
    </button>
  </div>
</template>

<style scoped>
.tempo-display {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}

.tempo-step,
.tempo-value {
  border: 0;
  background: none;
  color: inherit;
  border-radius: var(--dt-radius-button);
}

.tempo-step {
  display: flex;
  padding: 0.75rem;
  color: var(--dt-text-muted);
}

.tempo-step:hover:not(:disabled) {
  color: var(--dt-text);
  background-color: var(--dt-surface);
}

.tempo-step:disabled {
  opacity: 0.3;
}

.tempo-value {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  padding: 0 0.5rem;
}

.tempo-value:hover .bpm-unit {
  color: var(--dt-accent);
}

.bpm-number {
  font-size: var(--dt-font-display);
  font-weight: 500;
  line-height: 1;
  letter-spacing: -0.03em;
  /* Alle Ziffern gleich breit, damit die Anzeige beim Ändern nicht springt */
  font-variant-numeric: tabular-nums;
}

.bpm-unit {
  font-size: var(--dt-font-h2);
  color: var(--dt-text-muted);
  transition: color 0.15s;
}
</style>
