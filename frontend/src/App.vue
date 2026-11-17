<script setup lang="ts">
import AppToasts from '@/components/AppToasts.vue'
</script>

<template>
  <!-- Hier setzt der Router die aktuelle View ein. Das Layout regelt jede View selbst. -->
  <RouterView />
  <!-- Erfolgsmeldungen, unabhängig davon, welche View gerade offen ist -->
  <AppToasts />
</template>
