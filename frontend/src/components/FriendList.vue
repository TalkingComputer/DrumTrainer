<script setup lang="ts">
import type { PublicPlayer } from '@/types'
import FriendRow from './FriendRow.vue'

defineProps<{
  friends: PublicPlayer[]
}>()

const emit = defineEmits<{
  remove: [friend: PublicPlayer]
}>()
</script>

<template>
  <ul class="friend-list">
    <!-- Der Freundescode ist eindeutig, also ein guter key -->
    <li v-for="friend in friends" :key="friend.friendCode">
      <FriendRow :friend="friend" @remove="(clicked) => emit('remove', clicked)" />
    </li>
  </ul>
</template>

<style scoped>
.friend-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin: 0;
  padding: 0;
  list-style: none;
}
</style>
