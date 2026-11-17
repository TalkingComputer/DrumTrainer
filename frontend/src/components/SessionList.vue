<script setup lang="ts">
import type { Session } from '@/types'
import SessionCard from './SessionCard.vue'

defineProps<{
  sessions: Session[]
}>()

const emit = defineEmits<{
  edit: [session: Session]
  delete: [session: Session]
}>()
</script>

<template>
  <ul class="session-list">
    <li v-for="session in sessions" :key="session.id">
      <SessionCard
        :session="session"
        @edit="(clicked) => emit('edit', clicked)"
        @delete="(clicked) => emit('delete', clicked)"
      />
    </li>
  </ul>
</template>

<style scoped>
.session-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin: 0;
  padding: 0;
  list-style: none;
}
</style>
