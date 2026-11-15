<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getHealth } from '@/api/health'

const status = ref('Prüfe Verbindung...')

onMounted(async () => {
  try {
    const data = await getHealth()
    status.value = `Backend: ${data.status}`
  } catch {
    status.value = 'Backend nicht erreichbar'
  }
})
</script>

<template>
  <p>{{ status }}</p>
</template>
