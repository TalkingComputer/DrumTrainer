// Schließt einen Dialog, indem es zurück zum Übe-Bildschirm navigiert.
//
// Zwei Fälle:
// 1. Der Dialog wurde aus der App heraus geöffnet (Klick auf ein Icon).
//    Dann gibt es einen Eintrag davor im Browserverlauf. router.back() geht
//    dorthin zurück, wie der Zurück-Button des Browsers.
// 2. Jemand hat die URL direkt geöffnet, z. B. per geteiltem Link auf /rudiments.
//    Dann gibt es keinen Eintrag davor. router.back() würde die App verlassen,
//    darum stattdessen auf / wechseln.

import { useRouter } from 'vue-router'

// Vue Router merkt sich im Browserverlauf unter "back", von welcher Seite man kam.
// Steht dort etwas, wurde der Dialog aus der App heraus geöffnet.
export function cameFromApp(): boolean {
  const state = window.history.state
  if (state === null || state === undefined) {
    return false
  }
  return state.back !== null && state.back !== undefined
}

export function useCloseDialog() {
  const router = useRouter()

  function closeDialog(): void {
    if (cameFromApp()) {
      router.back()
    } else {
      router.replace({ name: 'metronome' })
    }
  }

  return { closeDialog }
}
