<script setup lang="ts">
defineProps<{
  title: string
  text?: string
}>()
</script>

<template>
  <!-- Anzeige für leere Listen, z. B. "No sessions yet" -->
  <div class="empty-state">
    <p class="empty-title">{{ title }}</p>
    <p v-if="text" class="empty-text">{{ text }}</p>
    <slot />
  </div>
</template>

<style scoped>
.empty-state {
  padding: 2.5rem 1rem;
  text-align: center;
  border: 2px dashed var(--dt-border);
  border-radius: var(--dt-radius-card);
}

.empty-title {
  margin-bottom: 0.25rem;
  font-size: var(--dt-font-body-l);
  font-weight: 500;
}

.empty-text {
  margin: 0;
  color: var(--dt-text-muted);
}
</style>
