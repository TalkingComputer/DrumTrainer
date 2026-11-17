<template>
  <!-- Logo: gelber Punkt und Schriftzug. Wird im Onboarding und in der TopBar genutzt. -->
  <div class="app-brand">
    <span class="brand-dot" aria-hidden="true"></span>
    DrumTrainer
  </div>
</template>

<style scoped>
.app-brand {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: var(--dt-font-body-l);
  font-weight: 600;
}

.brand-dot {
  width: 0.75rem;
  height: 0.75rem;
  border-radius: 50%;
  background-color: var(--dt-accent);
}
</style>
