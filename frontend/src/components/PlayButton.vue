<script setup lang="ts">
import AppIcon from './AppIcon.vue'

defineProps<{
  isPlaying: boolean
}>()

const emit = defineEmits<{
  toggle: []
}>()
</script>

<template>
  <button
    type="button"
    class="play-button"
    :aria-label="isPlaying ? 'Pause' : 'Play'"
    :aria-pressed="isPlaying"
    @click="emit('toggle')"
  >
    <AppIcon :name="isPlaying ? 'pause' : 'play'" :size="36" />
  </button>
</template>

<style scoped>
.play-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: clamp(4.25rem, 10vh, 5.5rem);
  height: clamp(4.25rem, 10vh, 5.5rem);
  flex-shrink: 0;
  border: 0;
  border-radius: 50%;
  background-color: var(--dt-accent);
  color: var(--dt-on-accent);
  transition:
    background-color 0.15s,
    transform 0.1s;
}

.play-button:hover {
  background-color: var(--dt-accent-hover);
}

.play-button:active {
  transform: scale(0.95);
}
</style>
