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

export function useCloseDialog() {
  const router = useRouter()

  function closeDialog(): void {
    // Vue Router merkt sich im Browserverlauf, von welcher Seite man kam
    const cameFromApp =
      window.history.state?.back !== null && window.history.state?.back !== undefined

    if (cameFromApp) {
      router.back()
    } else {
      router.replace({ name: 'metronome' })
    }
  }

  return { closeDialog }
}
