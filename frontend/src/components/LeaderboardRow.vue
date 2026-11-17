<script setup lang="ts">
// Eine Zeile im Leaderboard. Die eigene Zeile ist gelb hervorgehoben.
import type { LeaderboardEntry } from '@/types'

defineProps<{
  entry: LeaderboardEntry
  // Der Wert schon fertig als Text, z. B. "165" oder "1:42 h"
  valueText: string
}>()
</script>

<template>
  <!-- aria-current markiert die eigene Zeile auch für Screenreader -->
  <tr
    class="leaderboard-row"
    :class="{ 'is-me': entry.isMe }"
    :aria-current="entry.isMe || undefined"
  >
    <td class="cell-rank">{{ entry.rank }}</td>
    <td class="cell-name">{{ entry.isMe ? 'You' : entry.name }}</td>
    <td class="cell-value">{{ valueText }}</td>
  </tr>
</template>

<style scoped>
.leaderboard-row td {
  padding: 1rem 1.25rem;
  background-color: var(--dt-surface-2);
  border-block: 2px solid var(--dt-surface-2);
  font-size: var(--dt-font-body-l);
}

/* Abgerundete Ecken an der ersten und letzten Zelle ergeben eine runde Zeile */
.leaderboard-row td:first-child {
  border-left: 2px solid var(--dt-surface-2);
  border-radius: var(--dt-radius-card) 0 0 var(--dt-radius-card);
}

.leaderboard-row td:last-child {
  border-right: 2px solid var(--dt-surface-2);
  border-radius: 0 var(--dt-radius-card) var(--dt-radius-card) 0;
}

.cell-rank {
  width: 4rem;
  font-weight: 600;
  color: var(--dt-text-muted);
}

.cell-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 0; /* sorgt dafür, dass lange Namen abgeschnitten statt umgebrochen werden */
  width: 100%;
}

.cell-value {
  text-align: right;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}

/* Eigene Zeile: gelber Rahmen, gelb getönte Fläche, gelbe Schrift */
.leaderboard-row.is-me td {
  background-color: rgba(255, 217, 0, 0.18);
  border-color: var(--dt-accent);
  color: var(--dt-accent);
}

.leaderboard-row.is-me .cell-rank {
  color: var(--dt-accent);
}

@media (max-width: 575.98px) {
  .leaderboard-row td {
    padding: 0.75rem;
    font-size: var(--dt-font-body);
  }

  .cell-rank {
    width: 2.5rem;
  }
}
</style>
