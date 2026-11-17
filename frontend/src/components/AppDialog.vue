<script setup lang="ts">
// Gemeinsame Hülle für alle Dialoge:
// dunkler Hintergrund, Fenster in der Mitte, Kopfzeile mit X.
// Schließen per X, Escape-Taste und Klick auf den Hintergrund.
// Den eigentlichen Inhalt setzt jeder Dialog über den <slot> ein.
import { onMounted, onUnmounted, ref, useId } from 'vue'
import { useCloseDialog } from '@/composables/useCloseDialog'
import DialogHeader from './DialogHeader.vue'

withDefaults(
  defineProps<{
    title: string
    // Breite des Fensters: md für Formulare, lg für Raster und Tabellen
    size?: 'md' | 'lg'
  }>(),
  { size: 'md' },
)

const { closeDialog } = useCloseDialog()

// useId() erzeugt eine eindeutige id, auch wenn mehrere Dialoge existieren
const titleId = useId()

// ref auf das Fenster-Element im Template (siehe ref="panel" unten)
const panel = ref<HTMLElement | null>(null)

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    closeDialog()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
  // Seite dahinter nicht mitscrollen lassen
  document.body.classList.add('dialog-open')
  // Fokus ins Fenster setzen, damit die Tastatur direkt im Dialog arbeitet
  panel.value?.focus()
})

// Beim Schließen alles wieder aufräumen
onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  document.body.classList.remove('dialog-open')
})
</script>

<template>
  <!-- @click.self: nur Klicks direkt auf den Hintergrund, nicht auf das Fenster -->
  <div class="dialog-backdrop" @click.self="closeDialog">
    <div
      ref="panel"
      class="dialog-panel"
      :class="`dialog-${size}`"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="titleId"
      tabindex="-1"
    >
      <DialogHeader :title="title" :title-id="titleId" @close="closeDialog" />
      <div class="dialog-body">
        <slot />
      </div>
    </div>
  </div>
</template>

<style scoped>
.dialog-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1050;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background-color: rgba(0, 0, 0, 0.6);
  animation: fade-in 0.15s ease-out;
}

.dialog-panel {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  width: 100%;
  max-height: calc(100dvh - 2rem);
  padding: 2rem;
  background-color: var(--dt-surface);
  border-radius: var(--dt-radius-dialog);
  outline: none;
  animation: slide-up 0.2s ease-out;
}

.dialog-md {
  max-width: 34rem;
}

.dialog-lg {
  max-width: 64rem;
}

/* Langer Inhalt scrollt im Fenster, die Kopfzeile bleibt stehen */
.dialog-body {
  /* Langer Inhalt scrollt nach unten, aber nie zur Seite.
     Bootstraps .row hat negative Seitenränder (Gutter) und ragt sonst über den Rand. */
  overflow-x: hidden;
  overflow-y: auto;
  min-height: 0;
  /* Platz für Rahmen und Fokus-Ring am Rand, damit sie nicht abgeschnitten werden */
  margin: -0.5rem;
  padding: 0.5rem;
}

/* Handy: Dialog als Vollbild */
@media (max-width: 575.98px) {
  .dialog-backdrop {
    padding: 0;
  }

  .dialog-panel {
    height: 100dvh;
    max-height: none;
    padding: 1.25rem;
    border-radius: 0;
  }
}

@keyframes fade-in {
  from {
    opacity: 0;
  }
}

@keyframes slide-up {
  from {
    opacity: 0;
    transform: translateY(1rem);
  }
}

@media (prefers-reduced-motion: reduce) {
  .dialog-backdrop,
  .dialog-panel {
    animation: none;
  }
}
</style>
