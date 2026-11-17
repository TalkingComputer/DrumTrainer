<script setup lang="ts">
// Eine Session in der Liste: Datum, Gesamtdauer, Löschen-Button
// und darunter alle gespielten Rudimente als Chips.
import type { Session } from '@/types'
import { useRudiments } from '@/composables/useRudiments'
import { formatClock, formatMinutes, formatSessionDate } from '@/utils/format'
import AppChip from './AppChip.vue'
import AppIcon from './AppIcon.vue'

defineProps<{
  session: Session
}>()

const emit = defineEmits<{
  edit: [session: Session]
  delete: [session: Session]
}>()

const { findRudiment } = useRudiments()

// Name zum Rudiment. Gibt es die id nicht mehr in rudiments.json,
// zeigen wir wenigstens die id an, statt nichts.
function rudimentName(rudimentId: string): string {
  const rudiment = findRudiment(rudimentId)
  if (rudiment === undefined) {
    return rudimentId
  }
  return rudiment.name
}
</script>

<template>
  <article class="session-card">
    <header class="session-header">
      <h3 class="session-date">{{ formatSessionDate(session.date) }}</h3>
      <span class="session-duration">{{ formatClock(session.durationSeconds) }}</span>
      <button
        type="button"
        class="icon-button"
        :aria-label="`Edit session from ${formatSessionDate(session.date)}`"
        @click="emit('edit', session)"
      >
        <AppIcon name="pencil" :size="20" />
      </button>
      <button
        type="button"
        class="icon-button delete-button"
        :aria-label="`Delete session from ${formatSessionDate(session.date)}`"
        @click="emit('delete', session)"
      >
        <AppIcon name="trash" :size="22" />
      </button>
    </header>

    <ul class="session-rudiments">
      <!-- index als key, weil dasselbe Rudiment mehrmals vorkommen kann -->
      <li v-for="(played, index) in session.playedRudiments" :key="index">
        <AppChip>
          {{ rudimentName(played.rudimentId) }} · {{ played.bpm }} BPM ·
          {{ formatMinutes(played.durationSeconds) }}
        </AppChip>
      </li>
    </ul>
  </article>
</template>

<style scoped>
.session-card {
  padding: 1.25rem 1.5rem;
  border-radius: var(--dt-radius-card);
  background-color: var(--dt-surface-2);
}

.session-header {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.session-date {
  flex-grow: 1;
  margin: 0;
  font-size: var(--dt-font-body-l);
  font-weight: 500;
}

.session-duration {
  color: var(--dt-text-muted);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.icon-button {
  display: flex;
  padding: 0.5rem;
  border: 0;
  border-radius: 50%;
  background: none;
  color: var(--dt-text);
}

.icon-button:hover {
  background-color: var(--dt-surface-3);
}

.delete-button:hover {
  color: var(--bs-danger);
}

.session-rudiments {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin: 1rem 0 0;
  padding: 0;
  list-style: none;
}

/* Handy: Datum über die ganze Breite, Dauer und Löschen darunter */
@media (max-width: 575.98px) {
  .session-header {
    flex-wrap: wrap;
  }

  .session-date {
    flex-basis: 100%;
  }
}
</style>
