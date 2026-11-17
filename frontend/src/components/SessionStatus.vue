<script setup lang="ts">
// Anzeige oben rechts: "Session 12:34 · 2 rudiments"
import { computed } from 'vue'
import { formatTimer } from '@/utils/format'
import AppIcon from './AppIcon.vue'

const props = defineProps<{
  sessionSeconds: number
  rudimentCount: number
  // true, solange das Metronom läuft und Übezeit gezählt wird
  isRecording: boolean
}>()

const rudimentText = computed(() => {
  const word = props.rudimentCount === 1 ? 'rudiment' : 'rudiments'
  return props.rudimentCount + ' ' + word
})
</script>

<template>
  <!-- Kein aria-live: Die Zeit ändert sich jede Sekunde, das wäre für Screenreader zu viel -->
  <div class="session-status">
    <!-- Roter Punkt = Aufnahme läuft, Uhr = Session pausiert -->
    <span v-if="isRecording" class="recording-dot" aria-hidden="true"></span>
    <AppIcon v-else name="clock" :size="18" />
    <span>
      Session <span class="session-time">{{ formatTimer(sessionSeconds) }}</span>
    </span>
    <span aria-hidden="true">·</span>
    <span>{{ rudimentText }}</span>
  </div>
</template>

<style scoped>
.session-status {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 999px;
  background-color: var(--dt-surface);
  color: var(--dt-text-muted);
  font-size: var(--dt-font-caption);
  white-space: nowrap;
}

.recording-dot {
  width: 0.625rem;
  height: 0.625rem;
  margin-inline: 0.25rem;
  border-radius: 50%;
  background-color: var(--bs-danger);
}

.session-time {
  font-variant-numeric: tabular-nums;
}

@media (max-width: 575.98px) {
  .session-status {
    padding: 0.375rem 0.75rem;
  }
}
</style>
