<script setup lang="ts">
// Zeigt alle Meldungen aus useToast oben in der Mitte an
import { useToast } from '@/composables/useToast'
import AppIcon from './AppIcon.vue'

const { toasts, removeToast } = useToast()
</script>

<template>
  <!-- role="status" + aria-live: Screenreader lesen neue Meldungen vor,
       ohne den Nutzer bei seiner aktuellen Tätigkeit zu unterbrechen -->
  <div class="toast-area" role="status" aria-live="polite">
    <!-- TransitionGroup: Vue blendet Elemente beim Hinzufügen und Entfernen weich ein und aus -->
    <TransitionGroup name="toast">
      <div v-for="toast in toasts" :key="toast.id" class="app-toast">
        <span>{{ toast.message }}</span>
        <button
          type="button"
          class="toast-close"
          aria-label="Dismiss"
          @click="removeToast(toast.id)"
        >
          <AppIcon name="close" :size="16" />
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-area {
  position: fixed;
  top: 1rem;
  left: 50%;
  z-index: 1100; /* über allen Dialogen */
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  transform: translateX(-50%);
  pointer-events: none;
}

.app-toast {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.625rem 0.75rem 0.625rem 1.25rem;
  border-radius: 999px;
  background-color: var(--dt-accent);
  color: var(--dt-on-accent);
  font-weight: 500;
  box-shadow: 0 0.5rem 1.5rem rgba(0, 0, 0, 0.4);
  pointer-events: auto;
}

.toast-close {
  display: flex;
  padding: 0.25rem;
  border: 0;
  border-radius: 50%;
  background: none;
  color: inherit;
}

.toast-close:hover {
  background-color: rgba(0, 0, 0, 0.1);
}

/* Klassen für TransitionGroup: von oben einschweben, nach oben ausblenden */
.toast-enter-active,
.toast-leave-active {
  transition:
    opacity 0.2s,
    transform 0.2s;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(-0.75rem);
}

@media (prefers-reduced-motion: reduce) {
  .toast-enter-active,
  .toast-leave-active {
    transition: none;
  }
}
</style>
