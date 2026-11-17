// Lädt die Rudimente einmal vom Backend und teilt sie mit allen Komponenten.
// Übe-Bildschirm und Auswahl-Dialog brauchen dieselbe Liste,
// sie soll aber nur einmal über das Netz kommen.

import { ref } from 'vue'
import { getRudiments } from '@/api/rudiments'
import type { Rudiment } from '@/types'

// Gemeinsamer Zustand, wie bei useMetronome außerhalb der Funktion
const rudiments = ref<Rudiment[]>([])
const isLoading = ref(false)
const errorMessage = ref('')
let hasLoaded = false

async function loadRudiments(): Promise<void> {
  // Schon geladen oder lädt gerade: nichts tun
  if (hasLoaded || isLoading.value) {
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    rudiments.value = await getRudiments()
    hasLoaded = true
  } catch (error) {
    if (error instanceof Error) {
      errorMessage.value = error.message
    } else {
      errorMessage.value = 'Could not load rudiments.'
    }
  } finally {
    isLoading.value = false
  }
}

function findRudiment(rudimentId: string | null): Rudiment | undefined {
  for (const rudiment of rudiments.value) {
    if (rudiment.id === rudimentId) {
      return rudiment
    }
  }
  return undefined
}

export function useRudiments() {
  return {
    rudiments,
    isLoading,
    errorMessage,
    loadRudiments,
    findRudiment,
  }
}
