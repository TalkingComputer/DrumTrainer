<script setup lang="ts">
// Ein Freund in der Liste: Anfangsbuchstabe, Name, Code, Entfernen.
import { computed } from 'vue'
import type { PublicPlayer } from '@/types'
import AppIcon from './AppIcon.vue'

const props = defineProps<{
  friend: PublicPlayer
}>()

const emit = defineEmits<{
  remove: [friend: PublicPlayer]
}>()

// Erster Buchstabe des Namens als "Avatar"
const initial = computed(() => props.friend.name.trim().charAt(0).toUpperCase())
</script>

<template>
  <div class="friend-row">
    <span class="avatar" aria-hidden="true">{{ initial }}</span>
    <div class="friend-text">
      <span class="friend-name">{{ friend.name }}</span>
      <span class="friend-code">{{ friend.friendCode }}</span>
    </div>
    <button
      type="button"
      class="remove-button"
      :aria-label="`Remove ${friend.name} from friends`"
      @click="emit('remove', friend)"
    >
      <AppIcon name="trash" :size="22" />
    </button>
  </div>
</template>

<style scoped>
.friend-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1rem;
  border-radius: var(--dt-radius-card);
  background-color: var(--dt-surface-2);
}

.avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 2.75rem;
  height: 2.75rem;
  border-radius: 50%;
  background-color: var(--dt-surface-3);
  font-weight: 600;
}

.friend-text {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  min-width: 0;
}

.friend-name {
  font-size: var(--dt-font-body-l);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.friend-code {
  font-size: var(--dt-font-caption);
  color: var(--dt-text-muted);
}

.remove-button {
  display: flex;
  flex-shrink: 0;
  padding: 0.5rem;
  border: 0;
  border-radius: 50%;
  background: none;
  color: var(--dt-text);
}

.remove-button:hover {
  background-color: var(--dt-surface-3);
  color: var(--bs-danger);
}
</style>
