<script setup lang="ts">
import AppBrand from './AppBrand.vue'
</script>

<template>
  <header class="top-bar">
    <AppBrand />
    <!-- Rechts kann die Elternkomponente eigenen Inhalt einsetzen,
         später den Session-Status. Dafür ist der <slot> da. -->
    <slot />
  </header>
</template>

<style scoped>
.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.25rem 1.5rem;
}
</style>
