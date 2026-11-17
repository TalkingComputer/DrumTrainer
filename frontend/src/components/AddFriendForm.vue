<script setup lang="ts">
// Eingabefeld für den Freundescode mit "Add"-Button.
// Den Code hält die Elternkomponente (v-model:code). So kann sie das Feld
// nach dem Hinzufügen leeren.
import { computed } from 'vue'

const code = defineModel<string>('code', { required: true })

const props = defineProps<{
  isAdding: boolean
  errorMessage: string
}>()

const emit = defineEmits<{
  add: []
}>()

const canAdd = computed(() => code.value.trim().length > 0 && !props.isAdding)
</script>

<template>
  <form novalidate @submit.prevent="emit('add')">
    <label for="friend-code" class="form-label field-label">Friend code</label>
    <div class="input-row">
      <input
        id="friend-code"
        v-model="code"
        type="text"
        class="form-control form-control-lg"
        :class="{ 'is-invalid': errorMessage !== '' }"
        placeholder="DRUM-1234"
        autocomplete="off"
        autocapitalize="characters"
        spellcheck="false"
      />
      <button type="submit" class="btn btn-primary btn-lg" :disabled="!canAdd">
        <span
          v-if="isAdding"
          class="spinner-border spinner-border-sm me-2"
          aria-hidden="true"
        ></span>
        Add
      </button>
    </div>
    <div v-if="errorMessage" class="invalid-feedback d-block">{{ errorMessage }}</div>
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
