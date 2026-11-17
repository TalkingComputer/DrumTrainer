<script setup lang="ts">
// Renders a rudiment pattern as inline SVG.
// The SVG uses currentColor, so the CSS `color` of this component sets the note color.
// v-html is safe here: renderRudiment only outputs numbers and the letters R/L, never raw input text.
import { computed } from 'vue'
import { renderRudiment } from '@shared/rudimentNotation'

const props = withDefaults(
  defineProps<{
    pattern: string
    name?: string
    beamGroup?: number
    showSticking?: boolean
  }>(),
  { name: '', beamGroup: 1, showSticking: true },
)

const svg = computed(() =>
  renderRudiment(props.pattern, { beamGroup: props.beamGroup, showSticking: props.showSticking }),
)
</script>

<template>
  <div
    class="rudiment-notation"
    role="img"
    :aria-label="name ? `Notation: ${name}` : 'Rudiment notation'"
    v-html="svg"
  />
</template>

<style scoped>
.rudiment-notation {
  color: var(--bs-body-color, #fff);
  display: flex;
  justify-content: center;
}
.rudiment-notation :deep(svg) {
  width: 100%;
  max-width: 560px;
  height: auto;
}
</style>
