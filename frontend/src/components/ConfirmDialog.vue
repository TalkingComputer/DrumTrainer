<script setup lang="ts">
// Sicherheitsabfrage, z. B. "Delete session?".
// Sie liegt ÜBER einem anderen Dialog und hat deshalb keine eigene Route.
// Die Elternkomponente blendet sie per v-if ein und hört auf confirm und cancel.
import { onMounted, onUnmounted, ref, useId } from 'vue'

withDefaults(
  defineProps<{
    title: string
    message: string
    confirmLabel?: string
    // true, solange die Aktion läuft. Sperrt die Buttons.
    isBusy?: boolean
    errorMessage?: string
  }>(),
  { confirmLabel: 'Confirm', isBusy: false, errorMessage: '' },
)

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

const titleId = useId()
const cancelButton = ref<HTMLButtonElement | null>(null)

// Escape schließt nur diese Abfrage, nicht den Dialog darunter.
// Der dritte Parameter "true" meldet den Listener für die Capture-Phase an.
// Er läuft damit VOR dem Escape-Listener von AppDialog, und stopPropagation()
// verhindert, dass dieser die Taste überhaupt noch bekommt.
function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    event.stopPropagation()
    emit('cancel')
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown, true)
  // Fokus auf "Cancel": Ein versehentliches Enter löscht so nichts
  cancelButton.value?.focus()
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown, true)
})
</script>

<template>
  <div class="confirm-backdrop" @click.self="emit('cancel')">
    <div class="confirm-panel" role="alertdialog" aria-modal="true" :aria-labelledby="titleId">
      <h2 :id="titleId" class="confirm-title">{{ title }}</h2>
      <p class="confirm-message">{{ message }}</p>

      <div v-if="errorMessage" class="alert alert-danger py-2" role="alert">
        {{ errorMessage }}
      </div>

      <div class="confirm-actions">
        <button
          ref="cancelButton"
          type="button"
          class="btn btn-secondary btn-lg"
          :disabled="isBusy"
          @click="emit('cancel')"
        >
          Cancel
        </button>
        <button
          type="button"
          class="btn btn-primary btn-lg"
          :disabled="isBusy"
          @click="emit('confirm')"
        >
          <span
            v-if="isBusy"
            class="spinner-border spinner-border-sm me-2"
            aria-hidden="true"
          ></span>
          {{ confirmLabel }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.confirm-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1060; /* über AppDialog (1050) */
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background-color: rgba(0, 0, 0, 0.5);
}

.confirm-panel {
  width: 100%;
  max-width: 28rem;
  padding: 2rem;
  background-color: var(--dt-surface);
  border-radius: var(--dt-radius-dialog);
}

.confirm-title {
  margin-bottom: 0.75rem;
  font-size: var(--dt-font-h1);
}

.confirm-message {
  color: var(--dt-text-muted);
}

.confirm-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1.5rem;
}
</style>
