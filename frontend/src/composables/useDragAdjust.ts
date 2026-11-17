// Zahlenwerte per Ziehen ändern, mit Maus oder Finger.
// Nach oben oder rechts ziehen erhöht den Wert, nach unten oder links senkt ihn.
//
// Nutzung in einer Komponente:
//   const drag = useDragAdjust({ getValue, setValue, step: 1, pixelsPerStep: 5 })
//   <div @pointerdown="drag.onPointerDown"> … </div>
//
// Pointer Events fassen Maus, Finger und Stift in einer Schnittstelle zusammen.

import { onUnmounted } from 'vue'

interface DragAdjustOptions {
  // Liest den aktuellen Wert beim Start des Ziehens
  getValue: () => number
  // Schreibt den neuen Wert, während gezogen wird
  setValue: (value: number) => void
  // Um wie viel sich der Wert pro Schritt ändert, z. B. 1 BPM oder 15 Sekunden
  step: number
  // Wie viele Pixel Bewegung einen Schritt ergeben. Kleiner = empfindlicher.
  pixelsPerStep: number
  // true: nach UNTEN ziehen erhöht den Wert. Für Drehräder, bei denen der
  // höhere Wert oben steht und man ihn in die Mitte herunterzieht.
  invertVertical?: boolean
}

// Erst ab dieser Strecke gilt die Bewegung als Ziehen.
// Ein normaler Klick oder Tipp wackelt meist ein, zwei Pixel.
const DRAG_THRESHOLD = 4

export function useDragAdjust(options: DragAdjustOptions) {
  let startX = 0
  let startY = 0
  let startValue = 0
  let activePointerId: number | null = null
  let isDragging = false
  // Merkt sich, ob gerade gezogen wurde. Dann soll der folgende Klick nichts auslösen.
  let justDragged = false

  function onPointerDown(event: PointerEvent) {
    // Nur linke Maustaste bzw. Finger, keine rechte Maustaste
    if (event.button !== 0) {
      return
    }
    startX = event.clientX
    startY = event.clientY
    startValue = options.getValue()
    activePointerId = event.pointerId
    isDragging = false
    justDragged = false

    // Auf dem ganzen Fenster lauschen: Der Finger darf beim Ziehen das Element verlassen
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', stop)
    window.addEventListener('pointercancel', stop)
  }

  function onPointerMove(event: PointerEvent) {
    if (event.pointerId !== activePointerId) {
      return
    }

    const deltaX = event.clientX - startX
    // Bildschirm-y wächst nach unten. Wir drehen es um: nach oben = positiv.
    // Bei invertVertical bleibt es wie auf dem Bildschirm: nach unten = positiv.
    const deltaY = options.invertVertical ? event.clientY - startY : startY - event.clientY

    if (!isDragging) {
      if (Math.abs(deltaX) < DRAG_THRESHOLD && Math.abs(deltaY) < DRAG_THRESHOLD) {
        return
      }
      isDragging = true
      justDragged = true
      // Während des Ziehens keinen Text markieren und kein Eingabefeld fokussiert lassen
      document.body.classList.add('is-drag-adjusting')
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur()
      }
    }

    event.preventDefault()
    const steps = Math.round((deltaX + deltaY) / options.pixelsPerStep)
    options.setValue(startValue + steps * options.step)
  }

  function stop() {
    window.removeEventListener('pointermove', onPointerMove)
    window.removeEventListener('pointerup', stop)
    window.removeEventListener('pointercancel', stop)
    document.body.classList.remove('is-drag-adjusting')
    activePointerId = null
    isDragging = false
  }

  // Für Elemente, die auch auf Klick reagieren (z. B. BPM-Zahl öffnet den Tempo-Dialog):
  // true, wenn der Klick nur das Ende eines Ziehens war. Setzt sich dabei zurück.
  function wasJustDragged(): boolean {
    const result = justDragged
    justDragged = false
    return result
  }

  // Wird die Komponente entfernt, während jemand zieht: Listener aufräumen
  onUnmounted(stop)

  return { onPointerDown, wasJustDragged }
}
