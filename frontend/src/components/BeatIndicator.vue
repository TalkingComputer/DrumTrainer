<script setup lang="ts">
// Ein Punkt pro Schlag im Takt.
// Jeder Schlag ist ein Ring, Schlag 1 gelb, die übrigen weiß.
// Beim Klick blinkt der Ring in seiner Farbe auf und blendet dann wieder aus.
import { computed } from 'vue'

const props = defineProps<{
  beatsPerMeasure: number
  // Aktueller Schlag, beginnend bei 0. -1 heißt: Metronom steht.
  currentBeat: number
  // Zählt jeden Schlag hoch (siehe useMetronome). Optional.
  pulse?: number
}>()

// key für einen Punkt. Der aktive Punkt bekommt bei jedem Schlag einen neuen key.
// Vue erzeugt das Element dann neu, und die CSS-Animation startet von vorn.
// Ohne das würde bei 1 Schlag pro Takt nur der erste Schlag aufblinken,
// weil die Klasse is-active einfach dran bleibt.
function dotKey(index: number): string {
  if (index === props.currentBeat) {
    return 'active-' + (props.pulse ?? 0)
  }
  return 'dot-' + index
}

// Bei vielen Schlägen werden die Punkte kleiner, damit sie in eine Zeile passen
const isDense = computed(() => props.beatsPerMeasure > 7)

// Liefert die CSS-Klassen für den Punkt an Position index (0, 1, 2, …)
function dotClasses(index: number) {
  return {
    'is-first': index === 0,
    'is-active': index === props.currentBeat,
  }
}
</script>

<template>
  <!-- Rein optisch, Screenreader brauchen das nicht. Den Takt hören sie. -->
  <ol class="beat-indicator" :class="{ 'is-dense': isDense }" aria-hidden="true">
    <!-- v-for mit einer Zahl zählt von 1 bis zu dieser Zahl -->
    <li
      v-for="beatNumber in beatsPerMeasure"
      :key="dotKey(beatNumber - 1)"
      class="beat-dot"
      :class="dotClasses(beatNumber - 1)"
    ></li>
  </ol>
</template>

<style scoped>
.beat-indicator {
  /* Punktgröße wächst mit der Fensterhöhe, bleibt aber zwischen 1.5 und 2.25 rem */
  --dot-size: clamp(1.5rem, 4vh, 2.25rem);
  --dot-gap: 0.75rem;
  display: flex;
  justify-content: center;
  gap: var(--dot-gap);
  margin: 0;
  padding: 0;
  list-style: none;
}

.beat-indicator.is-dense {
  --dot-size: clamp(1.1rem, 3vh, 1.6rem);
  --dot-gap: 0.5rem;
}

.beat-dot {
  /* Farbe für Rand und Aufblinken. Schlag 1 überschreibt sie mit Gelb. */
  --dot-color: var(--dt-text);
  width: var(--dot-size);
  height: var(--dot-size);
  flex-shrink: 0;
  border: 2px solid var(--dot-color);
  border-radius: 50%;
  background-color: transparent;
}

.beat-dot.is-first {
  --dot-color: var(--dt-accent);
}

/* Beim Klick: Ring füllt sich schlagartig und blendet dann wieder aus */
.beat-dot.is-active {
  animation: beat-flash 0.35s ease-out;
}

@keyframes beat-flash {
  from {
    background-color: var(--dot-color);
  }
  to {
    background-color: transparent;
  }
}
</style>
