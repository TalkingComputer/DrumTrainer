<script setup lang="ts">
// Eine Karte im Auswahl-Raster: Notenbild und Name.
// Die aktive Karte hat einen gelben Rahmen und gelben Namen.
import type { Rudiment } from '@/types'
import RudimentNotation from './RudimentNotation.vue'

defineProps<{
  rudiment: Rudiment
  isActive: boolean
}>()

const emit = defineEmits<{
  select: [rudimentId: string]
}>()
</script>

<template>
  <button
    type="button"
    class="rudiment-card"
    :class="{ 'is-active': isActive }"
    :aria-pressed="isActive"
    @click="emit('select', rudiment.id)"
  >
    <span class="card-notation">
      <RudimentNotation
        :pattern="rudiment.pattern"
        :name="rudiment.name"
        :beam-group="rudiment.beamGroup"
      />
    </span>
    <span class="card-name">{{ rudiment.name }}</span>
  </button>
</template>

<style scoped>
.rudiment-card {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  width: 100%;
  height: 100%;
  padding: 0.75rem 0.75rem 1rem;
  border: 2px solid transparent;
  border-radius: var(--dt-radius-card);
  background-color: var(--dt-surface-2);
  color: var(--dt-text);
  transition:
    border-color 0.15s,
    background-color 0.15s;
}

.rudiment-card:hover {
  background-color: var(--dt-surface-3);
}

.rudiment-card.is-active {
  border-color: var(--dt-accent);
}

.card-notation {
  display: flex;
  align-items: center;
  justify-content: center;
  /* Alle Karten gleich hoch, egal wie breit das Notenbild ist */
  aspect-ratio: 2 / 1;
  padding: 0.75rem;
  border-radius: calc(var(--dt-radius-card) - 0.5rem);
  background-color: var(--dt-bg);
}

.card-notation :deep(.rudiment-notation) {
  width: 100%;
  height: 100%;
}

.card-notation :deep(svg) {
  max-height: 100%;
}

.card-name {
  font-size: var(--dt-font-body-l);
  text-align: center;
}

.rudiment-card.is-active .card-name {
  color: var(--dt-accent);
}
</style>
