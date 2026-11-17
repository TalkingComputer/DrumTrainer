<script setup lang="ts">
// Kopfzeile jedes Dialogs: Überschrift links, X rechts.
import AppIcon from './AppIcon.vue'

defineProps<{
  title: string
  // id der Überschrift. Der Dialog verweist per aria-labelledby darauf,
  // damit Screenreader den Dialog mit seinem Titel ansagen.
  titleId: string
}>()

const emit = defineEmits<{
  close: []
}>()
</script>

<template>
  <header class="dialog-header">
    <h2 :id="titleId" class="dialog-title">{{ title }}</h2>
    <button type="button" class="close-button" aria-label="Close" @click="emit('close')">
      <AppIcon name="close" :size="24" />
    </button>
  </header>
</template>

<style scoped>
.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.dialog-title {
  margin: 0;
  font-size: var(--dt-font-h1);
}

.close-button {
  display: flex;
  flex-shrink: 0;
  padding: 0.5rem;
  border: 0;
  border-radius: 50%;
  background: none;
  color: var(--dt-text);
}

.close-button:hover {
  background-color: var(--dt-surface-2);
}
</style>
