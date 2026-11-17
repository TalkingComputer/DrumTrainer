<script setup lang="ts">
// Zahlen-Auswahl im Stil eines Drehrads: Wert in der Mitte, der nächsthöhere Wert
// darüber, der nächstniedrigere darunter.
// Ändern per Ziehen, Mausrad, Pfeiltasten oder Klick auf einen Nachbarwert.
import { computed } from 'vue'
import { useDragAdjust } from '@/composables/useDragAdjust'

const value = defineModel<number>({ required: true })

const props = withDefaults(
  defineProps<{
    label: string
    unit: string
    min: number
    max: number
    step?: number
    // "+5" statt "5" anzeigen, z. B. bei der Schrittweite
    showPlus?: boolean
  }>(),
  { step: 1, showPlus: false },
)

function setValue(newValue: number) {
  value.value = Math.min(props.max, Math.max(props.min, newValue))
}

function format(number: number): string {
  return (props.showPlus ? '+' : '') + number
}

// Nachbarwerte. Außerhalb des Bereichs bleibt die Stelle leer.
const previousText = computed(() => {
  const previous = value.value - props.step
  return previous >= props.min ? format(previous) : ''
})

const nextText = computed(() => {
  const next = value.value + props.step
  return next <= props.max ? format(next) : ''
})

// Ziehen wie an einem echten Rad: Den oberen (höheren) Wert zieht man nach unten
// in die Mitte. Nach unten ziehen erhöht also, nach oben ziehen senkt.
const drag = useDragAdjust({
  getValue: () => value.value,
  setValue: setValue,
  step: props.step,
  pixelsPerStep: 12,
  invertVertical: true,
})

// Klick auf einen Nachbarwert. Nach einem Ziehen ignorieren.
function clickNeighbor(direction: number) {
  if (drag.wasJustDragged()) {
    return
  }
  setValue(value.value + direction * props.step)
}

// Mausrad: nach oben drehen = größer
function handleWheel(event: WheelEvent) {
  if (event.deltaY < 0) {
    setValue(value.value + props.step)
  } else if (event.deltaY > 0) {
    setValue(value.value - props.step)
  }
}

// Tastatur, wie bei einem normalen Zahlen-Eingabefeld
function handleKeydown(event: KeyboardEvent) {
  let handled = true
  if (event.key === 'ArrowUp') {
    setValue(value.value + props.step)
  } else if (event.key === 'ArrowDown') {
    setValue(value.value - props.step)
  } else if (event.key === 'PageUp') {
    setValue(value.value + props.step * 10)
  } else if (event.key === 'PageDown') {
    setValue(value.value - props.step * 10)
  } else if (event.key === 'Home') {
    setValue(props.min)
  } else if (event.key === 'End') {
    setValue(props.max)
  } else {
    handled = false
  }
  if (handled) {
    event.preventDefault()
  }
}
</script>

<template>
  <div class="picker">
    <!-- role="spinbutton": Screenreader erkennen das Element als Zahlen-Auswahl
         und lesen Wert, Minimum und Maximum vor -->
    <div
      class="picker-wheel drag-adjustable"
      role="spinbutton"
      tabindex="0"
      :aria-label="label"
      :aria-valuenow="value"
      :aria-valuemin="min"
      :aria-valuemax="max"
      :aria-valuetext="`${format(value)} ${unit}`"
      @pointerdown="drag.onPointerDown"
      @wheel.prevent="handleWheel"
      @keydown="handleKeydown"
    >
      <button
        type="button"
        class="picker-neighbor"
        tabindex="-1"
        aria-hidden="true"
        @click="clickNeighbor(1)"
      >
        {{ nextText }}
      </button>
      <div class="picker-current">
        <span class="picker-value">{{ format(value) }}</span>
        <span class="picker-unit">{{ unit }}</span>
      </div>
      <button
        type="button"
        class="picker-neighbor"
        tabindex="-1"
        aria-hidden="true"
        @click="clickNeighbor(-1)"
      >
        {{ previousText }}
      </button>
    </div>
    <span class="picker-label" aria-hidden="true">{{ label }}</span>
  </div>
</template>

<style scoped>
.picker {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.picker-wheel {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  width: 100%;
  padding: 0.375rem;
  border-radius: var(--dt-radius-card);
  background-color: var(--dt-surface-2);
}

.picker-wheel:focus-visible {
  outline: 2px solid var(--dt-accent);
  outline-offset: 2px;
}

.picker-neighbor {
  min-height: 1.75rem;
  padding: 0;
  border: 0;
  background: none;
  color: var(--dt-text-subtle);
  font-size: var(--dt-font-caption);
  font-variant-numeric: tabular-nums;
  cursor: inherit;
}

.picker-neighbor:hover {
  color: var(--dt-text-muted);
}

.picker-current {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 0.3rem;
  padding: 0.5rem;
  border-radius: calc(var(--dt-radius-card) - 0.375rem);
  background-color: var(--dt-surface-3);
}

.picker-value {
  font-size: var(--dt-font-body-l);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.picker-unit {
  font-size: 0.75rem;
  color: var(--dt-text-muted);
}

.picker-label {
  color: var(--dt-text-muted);
}
</style>
