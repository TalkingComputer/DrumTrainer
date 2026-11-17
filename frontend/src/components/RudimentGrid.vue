<script setup lang="ts">
// Raster aus RudimentCards. Am Handy eine Spalte, ab 576 px zwei, ab 992 px drei.
import type { Rudiment } from '@/types'
import RudimentCard from './RudimentCard.vue'

defineProps<{
  rudiments: Rudiment[]
  activeRudimentId: string | null
}>()

const emit = defineEmits<{
  select: [rudimentId: string]
}>()
</script>

<template>
  <ul class="row row-cols-1 row-cols-sm-2 row-cols-lg-3 g-3 list-unstyled m-0">
    <li v-for="rudiment in rudiments" :key="rudiment.id" class="col">
      <!-- Das Event der Karte wird einfach nach oben weitergereicht -->
      <RudimentCard
        :rudiment="rudiment"
        :is-active="rudiment.id === activeRudimentId"
        @select="(rudimentId) => emit('select', rudimentId)"
      />
    </li>
  </ul>
</template>
