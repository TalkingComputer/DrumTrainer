<script setup lang="ts">
// Linke Hälfte des Übe-Bildschirms: Notenbild und Name des aktuellen Rudiments.
// Ein Klick meldet "select" an die Elternkomponente. Die öffnet dann die Auswahl.
import type { Rudiment } from '@/types'
import AppIcon from './AppIcon.vue'
import RudimentNotation from './RudimentNotation.vue'

// Props: Daten, die von oben hereinkommen
defineProps<{
  rudiment: Rudiment | undefined
}>()

// Events: Meldungen, die nach oben gehen
const emit = defineEmits<{
  select: []
}>()
</script>

<template>
  <button
    v-if="rudiment"
    type="button"
    class="rudiment-display"
    :aria-label="`Current rudiment: ${rudiment.name}. Choose another rudiment`"
    @click="emit('select')"
  >
    <div class="notation-card">
      <RudimentNotation :rudiment-id="rudiment.id" :name="rudiment.name" />
    </div>
    <span class="rudiment-name">
      {{ rudiment.name }}
      <AppIcon name="chevron-right" :size="20" />
    </span>
  </button>

  <!-- Platzhalter, solange die Rudimente noch laden -->
  <div v-else class="rudiment-display">
    <div class="notation-card notation-placeholder"></div>
    <span class="rudiment-name text-secondary">Loading…</span>
  </div>
</template>

<style scoped>
.rudiment-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  width: 100%;
  padding: 0;
  border: 0;
  background: none;
  color: inherit;
}

.notation-card {
  width: 100%;
  /* Höchstens 26rem breit, auf niedrigen Fenstern schmaler (55 % der Fensterhöhe) */
  max-width: min(26rem, 55vh);
  padding: clamp(1rem, 2.5vh, 1.5rem);
  background-color: var(--dt-surface);
  border-radius: var(--dt-radius-card);
  transition: background-color 0.15s;
}

.notation-placeholder {
  aspect-ratio: 2 / 1;
}

button.rudiment-display:hover .notation-card {
  background-color: var(--dt-surface-2);
}

.rudiment-name {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: var(--dt-font-h2);
  font-weight: 500;
}

.rudiment-name :deep(svg) {
  color: var(--dt-text-muted);
}
</style>
