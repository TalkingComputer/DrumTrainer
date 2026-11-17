<template>
  <!-- Kleines abgerundetes Etikett, z. B. für gespielte Rudimente -->
  <span class="app-chip"><slot /></span>
</template>

<style scoped>
.app-chip {
  display: inline-flex;
  align-items: center;
  padding: 0.375rem 0.875rem;
  border-radius: 999px;
  background-color: var(--dt-surface-3);
  font-size: var(--dt-font-caption);
  white-space: nowrap;
}
</style>
