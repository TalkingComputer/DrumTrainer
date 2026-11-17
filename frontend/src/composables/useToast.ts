// Kurze Rückmeldungen, die für ein paar Sekunden erscheinen ("Toast"),
// z. B. "Session saved" nach dem Speichern.
// Gemeinsamer Zustand wie bei useMetronome: Jede Komponente kann showToast() aufrufen,
// angezeigt werden alle Meldungen an einer Stelle (AppToasts.vue in App.vue).

import { ref } from 'vue'

export interface Toast {
  id: number
  message: string
}

const TOAST_DURATION_MS = 3000

const toasts = ref<Toast[]>([])
let nextId = 1

function showToast(message: string): void {
  const toast: Toast = { id: nextId, message: message }
  nextId = nextId + 1
  toasts.value.push(toast)

  // Nach 3 Sekunden wieder entfernen
  window.setTimeout(() => {
    removeToast(toast.id)
  }, TOAST_DURATION_MS)
}

function removeToast(id: number): void {
  toasts.value = toasts.value.filter((toast) => toast.id !== id)
}

export function useToast() {
  return { toasts, showToast, removeToast }
}
