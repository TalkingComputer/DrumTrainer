<script setup lang="ts">
// Zeigt den eigenen Freundescode groß an, mit "Copy"-Button.
// Kopieren ist reine Anzeige-Logik ohne Backend, deshalb steckt sie hier in der Komponente.
import { onUnmounted, ref } from 'vue'

const props = defineProps<{
  friendCode: string
}>()

// 'idle' = normal, 'copied' = gerade kopiert, 'failed' = Kopieren ging nicht
const copyState = ref<'idle' | 'copied' | 'failed'>('idle')
let resetTimer: number | undefined = undefined

async function copyCode() {
  try {
    // Clipboard API: schreibt Text in die Zwischenablage.
    // Funktioniert nur auf https oder localhost.
    await navigator.clipboard.writeText(props.friendCode)
    copyState.value = 'copied'
  } catch {
    copyState.value = 'failed'
  }

  // Nach 2 Sekunden wieder "Copy" anzeigen
  window.clearTimeout(resetTimer)
  resetTimer = window.setTimeout(() => {
    copyState.value = 'idle'
  }, 2000)
}

onUnmounted(() => {
  window.clearTimeout(resetTimer)
})
</script>

<template>
  <div class="code-card">
    <div class="code-text">
      <span class="code-value">{{ friendCode }}</span>
      <span class="code-hint">Share this code. Friends add you with it.</span>
    </div>
    <button type="button" class="btn btn-secondary" @click="copyCode">
      {{ copyState === 'copied' ? 'Copied!' : 'Copy' }}
    </button>
  </div>
  <p class="form-text" aria-live="polite">
    <span v-if="copyState === 'failed'" class="text-danger">
      Copying is not available here. Select the code and copy it by hand.
    </span>
  </p>
</template>

<style scoped>
.code-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.25rem 1.5rem;
  border-radius: var(--dt-radius-card);
  background-color: var(--dt-surface-2);
}

.code-text {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 0;
}

.code-value {
  font-size: var(--dt-font-h1);
  font-weight: 600;
  letter-spacing: 0.04em;
  color: var(--dt-accent);
  /* Code soll sich mit der Maus markieren lassen, falls Kopieren nicht geht */
  user-select: all;
}

.code-hint {
  font-size: var(--dt-font-caption);
  color: var(--dt-text-muted);
}
</style>
