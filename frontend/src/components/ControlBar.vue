<script setup lang="ts">
// Steuerleiste unten: Leaderboard, Sessions, Play/Pause, Send Session.
// Die Leiste selbst entscheidet nichts. Sie meldet nur, was geklickt wurde.
import AppIcon from './AppIcon.vue'
import PlayButton from './PlayButton.vue'

defineProps<{
  isPlaying: boolean
  canSendSession: boolean
}>()

const emit = defineEmits<{
  openLeaderboard: []
  openSessions: []
  togglePlay: []
  sendSession: []
}>()
</script>

<template>
  <nav class="control-bar" aria-label="Main controls">
    <div class="nav-pill">
      <button
        type="button"
        class="nav-button"
        aria-label="Leaderboard"
        @click="emit('openLeaderboard')"
      >
        <AppIcon name="users" :size="28" />
      </button>
      <button
        type="button"
        class="nav-button"
        aria-label="My sessions"
        @click="emit('openSessions')"
      >
        <AppIcon name="history" :size="28" />
      </button>
    </div>

    <PlayButton :is-playing="isPlaying" @toggle="emit('togglePlay')" />

    <button
      type="button"
      class="btn btn-primary btn-lg send-button"
      :disabled="!canSendSession"
      @click="emit('sendSession')"
    >
      Send Session
    </button>
  </nav>
</template>

<style scoped>
.control-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  padding: clamp(0.75rem, 2vh, 1.25rem) 1rem clamp(1rem, 3vh, 2rem);
}

.nav-pill {
  display: flex;
  gap: 0.25rem;
  padding: 0.5rem;
  background-color: var(--dt-surface);
  border-radius: 999px;
}

.nav-button {
  display: flex;
  padding: 0.875rem;
  border: 0;
  border-radius: 50%;
  background: none;
  color: var(--dt-text);
}

.nav-button:hover {
  background-color: var(--dt-surface-2);
}

.send-button {
  white-space: nowrap;
}

/* Schmale Bildschirme: Abstände verkleinern, damit alles in eine Zeile passt */
@media (max-width: 575.98px) {
  .control-bar {
    gap: 0.75rem;
    padding-bottom: 1.25rem;
  }

  .nav-button {
    padding: 0.625rem;
  }

  .send-button {
    padding-inline: 0.875rem;
    font-size: 1rem;
  }
}
</style>
