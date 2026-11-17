<script setup lang="ts">
withDefaults(defineProps<{ label?: string }>(), { label: 'Loading…' })
</script>

<template>
  <div class="d-flex align-items-center justify-content-center gap-2 py-4 text-secondary">
    <span class="spinner-border spinner-border-sm" aria-hidden="true"></span>
    <span role="status">{{ label }}</span>
  </div>
</template>
