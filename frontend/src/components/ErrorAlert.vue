<script setup lang="ts">
// Fehlermeldung mit optionalem "Try again"-Button.
// Der Button erscheint nur, wenn die Elternkomponente auf @retry hört.
defineProps<{
  message: string
  showRetry?: boolean
}>()

const emit = defineEmits<{
  retry: []
}>()
</script>

<template>
  <div
    class="alert alert-danger d-flex align-items-center justify-content-between gap-3"
    role="alert"
  >
    <span>{{ message }}</span>
    <button
      v-if="showRetry"
      type="button"
      class="btn btn-sm btn-outline-light flex-shrink-0"
      @click="emit('retry')"
    >
      Try again
    </button>
  </div>
</template>
