<script setup lang="ts">
// Eingabefeld für den eigenen Namen mit "Save"-Button.
// Den Namen hält die Elternkomponente (v-model:name), sie speichert auch.
import { computed } from 'vue'

const name = defineModel<string>('name', { required: true })

const props = defineProps<{
  // Der gespeicherte Name. Nur wenn sich die Eingabe davon unterscheidet, gibt es etwas zu speichern.
  savedName: string
  isSaving: boolean
  errorMessage: string
  justSaved: boolean
}>()

const emit = defineEmits<{
  save: []
}>()

const MAX_NAME_LENGTH = 30

const canSave = computed(() => {
  const trimmed = name.value.trim()
  return trimmed.length > 0 && trimmed !== props.savedName && !props.isSaving
})
</script>

<template>
  <form novalidate @submit.prevent="emit('save')">
    <label for="profile-name" class="form-label field-label">Name</label>
    <div class="input-row">
      <input
        id="profile-name"
        v-model="name"
        type="text"
        class="form-control form-control-lg"
        :class="{ 'is-invalid': errorMessage !== '' }"
        :maxlength="MAX_NAME_LENGTH"
        autocomplete="nickname"
      />
      <button type="submit" class="btn btn-secondary btn-lg" :disabled="!canSave">
        <span
          v-if="isSaving"
          class="spinner-border spinner-border-sm me-2"
          aria-hidden="true"
        ></span>
        Save
      </button>
    </div>
    <div v-if="errorMessage" class="invalid-feedback d-block">{{ errorMessage }}</div>
    <!-- aria-live: Screenreader lesen "Name saved" vor, sobald es erscheint -->
    <div class="form-text text-success" aria-live="polite">
      <span v-if="justSaved">Name saved.</span>
    </div>
  </form>
</template>

<style scoped>
.input-row {
  display: flex;
  gap: 0.75rem;
}

.input-row .btn {
  flex-shrink: 0;
}
</style>
