<script setup lang="ts">
// Rangliste als echte HTML-Tabelle. Optisch sind die Zeilen Karten,
// für Screenreader bleibt es eine Tabelle mit Spaltenköpfen.
import type { LeaderboardEntry, Metric } from '@/types'
import { formatPracticeTime } from '@/utils/format'
import LeaderboardRow from './LeaderboardRow.vue'

const props = defineProps<{
  entries: LeaderboardEntry[]
  metric: Metric
}>()

// Wert je nach Metrik als Text. 0 heißt: im Zeitraum nichts gespielt → Strich.
function valueText(entry: LeaderboardEntry): string {
  if (entry.value === 0) {
    return '–'
  }
  if (props.metric === 'bpm') {
    return String(entry.value)
  }
  return formatPracticeTime(entry.value)
}
</script>

<template>
  <table class="leaderboard-table">
    <thead>
      <tr>
        <th scope="col">Rank</th>
        <th scope="col">Name</th>
        <th scope="col" class="text-end">{{ metric === 'bpm' ? 'BPM' : 'Time' }}</th>
      </tr>
    </thead>
    <tbody>
      <LeaderboardRow
        v-for="entry in entries"
        :key="entry.friendCode"
        :entry="entry"
        :value-text="valueText(entry)"
      />
    </tbody>
  </table>
</template>

<style scoped>
.leaderboard-table {
  width: 100%;
  /* Abstand zwischen den Zeilen, damit sie wie einzelne Karten wirken */
  border-collapse: separate;
  border-spacing: 0 0.5rem;
}

th {
  padding: 0 1.25rem;
  font-size: var(--dt-font-caption);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--dt-text-muted);
}

@media (max-width: 575.98px) {
  th {
    padding: 0 0.75rem;
  }
}
</style>
