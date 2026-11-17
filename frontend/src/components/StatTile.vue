<script setup lang="ts">
defineProps<{
  value: string
  label: string
}>()
</script>

<template>
  <!-- Kachel mit großer Zahl und kleiner Beschriftung, z. B. "26:10 / SESSION TIME" -->
  <div class="stat-tile">
    <span class="stat-value">{{ value }}</span>
    <span class="stat-label">{{ label }}</span>
  </div>
</template>

<style scoped>
.stat-tile {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  height: 100%;
  padding: 1rem 1.25rem;
  border-radius: var(--dt-radius-card);
  background-color: var(--dt-surface-2);
}

.stat-value {
  font-size: var(--dt-font-h1);
  font-weight: 600;
  line-height: 1.1;
  font-variant-numeric: tabular-nums;
}

.stat-label {
  font-size: var(--dt-font-caption);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--dt-text-muted);
}

@media (max-width: 575.98px) {
  .stat-tile {
    padding: 0.75rem;
  }

  .stat-value {
    font-size: var(--dt-font-h2);
  }
}
</style>
