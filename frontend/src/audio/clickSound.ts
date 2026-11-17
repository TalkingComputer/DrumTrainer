// Erzeugt einen einzelnen Metronom-Klick mit der Web Audio API.
// Kein Sample, keine Audiodatei: Ein Oszillator erzeugt einen kurzen Ton,
// eine Lautstärke-Hüllkurve macht daraus einen "Klick".
//
//   OscillatorNode ──► GainNode ──► Lautsprecher (destination)
//   (Tonhöhe)          (Lautstärke)

// Schlag 1 klingt höher und lauter, damit man den Taktanfang hört
const ACCENT_FREQUENCY = 1600
const NORMAL_FREQUENCY = 1000
const ACCENT_VOLUME = 0.9
const NORMAL_VOLUME = 0.55
// Dauer des Klicks in Sekunden
const CLICK_LENGTH = 0.05

// Plant einen Klick zum Zeitpunkt "time" (in Sekunden auf der Uhr des AudioContext).
// Gibt den Oszillator zurück, damit ein Stopp noch geplante Klicks abbrechen kann.
export function playClick(context: AudioContext, time: number, isAccent: boolean): OscillatorNode {
  const oscillator = context.createOscillator()
  const gain = context.createGain()

  oscillator.type = 'sine'
  // Schlag 1 höher, alle anderen normal
  if (isAccent) {
    oscillator.frequency.value = ACCENT_FREQUENCY
  } else {
    oscillator.frequency.value = NORMAL_FREQUENCY
  }

  // Hüllkurve: in 2 ms auf volle Lautstärke, dann schnell abklingen.
  // Ein harter Ein- und Ausschalter würde knacken.
  // Exponentielle Rampen dürfen nicht bei 0 starten, deshalb 0.0001.
  let peak = NORMAL_VOLUME
  if (isAccent) {
    peak = ACCENT_VOLUME
  }
  gain.gain.setValueAtTime(0.0001, time)
  gain.gain.exponentialRampToValueAtTime(peak, time + 0.002)
  gain.gain.exponentialRampToValueAtTime(0.0001, time + CLICK_LENGTH)

  oscillator.connect(gain)
  gain.connect(context.destination)

  // start und stop mit Zeitangabe: Der Browser spielt den Ton exakt zu diesem Zeitpunkt,
  // auch wenn JavaScript gerade mit etwas anderem beschäftigt ist.
  oscillator.start(time)
  oscillator.stop(time + CLICK_LENGTH + 0.01)

  return oscillator
}
