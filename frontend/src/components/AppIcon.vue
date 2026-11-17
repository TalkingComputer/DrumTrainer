<script setup lang="ts">
// Kleine Icon-Sammlung als Inline-SVG. Kein zusätzliches Paket nötig.
// Die Linien nutzen currentColor, das Icon übernimmt also die Textfarbe.
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    name: string
    size?: number
  }>(),
  { size: 24 },
)

// Jedes Icon besteht aus einem oder mehreren SVG-Pfaden (24 × 24 Raster)
const ICON_PATHS: Record<string, string[]> = {
  'chevron-left': ['m15 18-6-6 6-6'],
  'chevron-right': ['m9 18 6-6-6-6'],
  plus: ['M12 5v14', 'M5 12h14'],
  minus: ['M5 12h14'],
  close: ['M18 6 6 18', 'm6 6 12 12'],
  zap: [
    'M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z',
  ],
  pencil: [
    'M21.17 6.81a1 1 0 0 0-3.99-3.99L3.84 16.17a2 2 0 0 0-.5.83l-1.32 4.35a.5.5 0 0 0 .62.62l4.35-1.32a2 2 0 0 0 .83-.5z',
    'm15 5 4 4',
  ],
  trash: [
    'M3 6h18',
    'M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6',
    'M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2',
  ],
  play: ['M7 4.5v15l12-7.5z'],
  pause: ['M7 5h3v14H7z', 'M14 5h3v14h-3z'],
  users: [
    'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2',
    'M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
    'M22 21v-2a4 4 0 0 0-3-3.87',
    'M16 3.13a4 4 0 0 1 0 7.75',
  ],
  history: ['M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8', 'M3 3v5h5', 'M12 7v5l4 2'],
  clock: ['M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0', 'M12 7v5l3 2'],
}

// Pfade zum gewünschten Icon. Unbekannter Name: leere Liste, also kein Icon.
const paths = computed(() => {
  const found = ICON_PATHS[props.name]
  if (found === undefined) {
    return []
  }
  return found
})
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <path v-for="path in paths" :key="path" :d="path" />
  </svg>
</template>
