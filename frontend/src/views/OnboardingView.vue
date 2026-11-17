<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { createPlayer } from '@/api/players'
import { savePlayerId } from '@/api/playerId'
import AppBrand from '@/components/AppBrand.vue'

const MAX_NAME_LENGTH = 30

const router = useRouter()

// Zustand der Seite. ref() macht die Werte reaktiv:
// Ändert sich ein Wert, aktualisiert Vue das Template automatisch.
const name = ref('')
const isSaving = ref(false)
const errorMessage = ref('')

// computed() berechnet einen Wert aus anderen Werten neu, sobald sich diese ändern
const trimmedName = computed(() => name.value.trim())
const canSubmit = computed(() => trimmedName.value.length > 0 && !isSaving.value)

async function handleSubmit() {
  if (!canSubmit.value) {
    return
  }

  isSaving.value = true
  errorMessage.value = ''

  try {
    // 1. Spieler im Backend anlegen
    const player = await createPlayer(trimmedName.value)
    // 2. Geheime id im Browser merken. Ab jetzt schickt apiRequest sie mit.
    savePlayerId(player.id)
    // 3. Weiter zum Übe-Bildschirm. replace statt push: "Zurück" führt nicht ins Onboarding.
    await router.replace({ name: 'metronome' })
  } catch (error) {
    if (error instanceof Error) {
      errorMessage.value = error.message
    } else {
      errorMessage.value = 'Something went wrong. Please try again.'
    }
  } finally {
    // finally läuft immer, egal ob Erfolg oder Fehler
    isSaving.value = false
  }
}
</script>

<template>
  <main class="onboarding">
    <section class="onboarding-card" aria-labelledby="welcome-title">
      <AppBrand />

      <h1 id="welcome-title" class="mt-4 mb-2">Welcome!</h1>
      <p class="text-secondary mb-4">
        Choose a name. Your friends see this name on the leaderboard. You can change it later.
      </p>

      <!-- .prevent verhindert, dass der Browser die Seite neu lädt -->
      <form novalidate @submit.prevent="handleSubmit">
        <label for="player-name" class="form-label field-label">Your name</label>
        <input
          id="player-name"
          v-model="name"
          type="text"
          class="form-control form-control-lg"
          :class="{ 'is-invalid': errorMessage !== '' }"
          placeholder="e.g. Alex"
          :maxlength="MAX_NAME_LENGTH"
          autocomplete="nickname"
          autofocus
        />
        <div v-if="errorMessage" class="invalid-feedback">{{ errorMessage }}</div>

        <button type="submit" class="btn btn-primary btn-lg w-100 mt-4" :disabled="!canSubmit">
          <span
            v-if="isSaving"
            class="spinner-border spinner-border-sm me-2"
            aria-hidden="true"
          ></span>
          Let's go
        </button>
      </form>
    </section>
  </main>
</template>

<style scoped>
.onboarding {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.onboarding-card {
  width: 100%;
  max-width: 30rem;
  padding: 2rem;
  background-color: var(--dt-surface);
  border-radius: var(--dt-radius-dialog);
}
</style>
