// Hält den Tastatur-Fokus in einem Dialog ("Focus Trap").
//
// Ohne das springt die Tab-Taste aus dem Dialog hinaus in die Seite dahinter,
// obwohl die gerade nicht bedienbar ist. Mit Focus Trap gilt:
//   - Tab auf dem letzten Element springt zum ersten zurück
//   - Shift+Tab auf dem ersten Element springt zum letzten
//   - Beim Öffnen landet der Fokus im Dialog
//   - Beim Schließen kehrt er dorthin zurück, wo er vorher war (z. B. auf den Button,
//     der den Dialog geöffnet hat)

import { onBeforeUnmount, onMounted, onUnmounted, type Ref } from 'vue'

// Alle Elemente, die per Tab erreichbar sind
const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ')

export function useFocusTrap(
  container: Ref<HTMLElement | null>,
  // Welches Element beim Öffnen den Fokus bekommt. Standard: der Container selbst.
  getInitialFocus?: () => HTMLElement | null,
) {
  let previouslyFocused: HTMLElement | null = null
  let trappedElement: HTMLElement | null = null

  function getFocusableElements(): HTMLElement[] {
    if (container.value === null) {
      return []
    }
    const all = container.value.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
    // Unsichtbare Elemente (display: none) überspringen
    return Array.from(all).filter((element) => element.offsetParent !== null)
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key !== 'Tab' || container.value === null) {
      return
    }
    // Liegt ein Dialog in einem anderen (z. B. Sicherheitsabfrage im Sessions-Dialog),
    // soll nur der innere den Tab behandeln
    event.stopPropagation()

    const focusable = getFocusableElements()
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (first === undefined || last === undefined) {
      event.preventDefault()
      container.value.focus()
      return
    }

    const active = document.activeElement
    if (event.shiftKey && (active === first || active === container.value)) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && active === last) {
      event.preventDefault()
      first.focus()
    }
  }

  onMounted(() => {
    // Merken, wo der Fokus vorher war
    if (document.activeElement instanceof HTMLElement) {
      previouslyFocused = document.activeElement
    }
    trappedElement = container.value
    if (trappedElement !== null) {
      trappedElement.addEventListener('keydown', handleKeydown)
    }

    // Erstes Fokus-Ziel: das vom Aufrufer gewünschte Element, sonst der Container
    let initial = container.value
    if (getInitialFocus !== undefined) {
      initial = getInitialFocus()
    }
    if (initial !== null) {
      initial.focus()
    }
  })

  onBeforeUnmount(() => {
    if (trappedElement !== null) {
      trappedElement.removeEventListener('keydown', handleKeydown)
    }
  })

  onUnmounted(() => {
    // Fokus zurückgeben, falls das Element noch auf der Seite ist
    if (previouslyFocused !== null && previouslyFocused.isConnected) {
      previouslyFocused.focus()
    }
  })
}
