<script setup lang="ts">
// Fortschritt der Automation auf dem Übe-Bildschirm:
// Balken von Start- bis Ziel-Tempo, nächster Schritt, Stufe, Button "Stop".
import { computed } from 'vue'
import AppIcon from './AppIcon.vue'

const props = defineProps<{
  startBpm: number
  endBpm: number
  currentBpm: number
  stepBpm: number
  measuresUntilNextStep: number
  step: number
  totalSteps: number
}>()

const emit = defineEmits<{
  stop: []
}>()

// Fortschritt in Prozent für die Breite des Balkens
const progressPercent = computed(() => {
  const range = props.endBpm - props.startBpm
  if (range <= 0) {
    return 100
  }
  const done = ((props.currentBpm - props.startBpm) / range) * 100
  return Math.min(100, Math.max(0, done))
})

const nextStepText = computed(() => {
  const word = props.measuresUntilNextStep === 1 ? 'measure' : 'measures'
  return `Next step +${props.stepBpm} BPM in ${props.measuresUntilNextStep} ${word}`
})
</script>

<template>
  <section class="automation-status" aria-label="Automation">
    <header class="status-header">
      <span class="status-title">
        <AppIcon name="zap" :size="18" />
        Automation running
      </span>
      <button type="button" class="btn btn-sm btn-outline-secondary" @click="emit('stop')">
        Stop
      </button>
    </header>

    <div class="status-range" aria-hidden="true">
      <span>{{ startBpm }} BPM</span>
      <span>{{ endBpm }} BPM</span>
    </div>
    <!-- role="progressbar": Screenreader lesen den Fortschritt als Prozentwert vor -->
    <div
      class="progress"
      role="progressbar"
      :aria-valuenow="currentBpm"
      :aria-valuemin="startBpm"
      :aria-valuemax="endBpm"
      :aria-valuetext="`${currentBpm} of ${endBpm} BPM`"
    >
      <div class="progress-bar" :style="{ width: progressPercent + '%' }"></div>
    </div>

    <p class="status-text">
      {{ nextStepText }} <span aria-hidden="true">·</span> Step {{ step }} of {{ totalSteps }}
    </p>
  </section>
</template>

<style scoped>
.automation-status {
  width: 100%;
  max-width: 30rem;
  padding: 1rem 1.25rem;
  border-radius: var(--dt-radius-card);
  background-color: var(--dt-surface);
}

.status-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.75rem;
}

.status-title {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
}

.status-title :deep(svg) {
  color: var(--dt-accent);
}

.status-range {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.25rem;
  font-size: 0.75rem;
  color: var(--dt-text-muted);
}

.progress {
  height: 0.5rem;
  background-color: var(--dt-surface-3);
}

.progress-bar {
  background-color: var(--dt-accent);
  transition: width 0.3s ease-out;
}

.status-text {
  margin: 0.75rem 0 0;
  font-size: var(--dt-font-caption);
  color: var(--dt-text-muted);
}
</style>
