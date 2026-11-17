// Tap Tempo: Der Nutzer tippt im gewünschten Tempo auf einen Button.
// Aus den Abständen zwischen den Taps ergibt sich das BPM.
//
// Beispiel: Taps im Abstand von 500 ms → 60 000 ms / 500 ms = 120 BPM

import { ref } from 'vue'

// Nur die letzten Taps zählen. So passt sich das Tempo an, wenn man schneller wird.
const MAX_TAPS = 6
// Längere Pause = neuer Anlauf, die alten Taps werden verworfen
const RESET_AFTER_MS = 2000

export function useTapTempo() {
  let tapTimes: number[] = []
  // Anzahl der Taps im aktuellen Anlauf, für die Anzeige im Button
  const tapCount = ref(0)

  // Einen Tap registrieren. Gibt das berechnete BPM zurück
  // oder null, solange es noch keine zwei Taps gibt.
  function tap(): number | null {
    // performance.now() misst genauer als Date.now(), in Bruchteilen von Millisekunden
    const now = performance.now()
    const lastTap = tapTimes[tapTimes.length - 1]

    if (lastTap !== undefined && now - lastTap > RESET_AFTER_MS) {
      tapTimes = []
    }

    tapTimes.push(now)
    if (tapTimes.length > MAX_TAPS) {
      tapTimes.shift() // ältesten Tap entfernen
    }
    tapCount.value = tapTimes.length

    const firstTap = tapTimes[0]
    if (firstTap === undefined || tapTimes.length < 2) {
      return null
    }

    // Durchschnittlicher Abstand: Gesamtzeit geteilt durch Anzahl der Lücken
    const averageInterval = (now - firstTap) / (tapTimes.length - 1)
    return 60000 / averageInterval
  }

  return { tap, tapCount }
}
