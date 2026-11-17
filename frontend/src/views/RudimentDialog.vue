<script setup lang="ts">
// Dialog "Choose rudiment" unter /rudiments.
// Zeigt alle Rudimente als Raster. Ein Klick wählt das Rudiment und schließt den Dialog.
import { onMounted } from 'vue'
import { useMetronome } from '@/composables/useMetronome'
import { useRudiments } from '@/composables/useRudiments'
import { useCloseDialog } from '@/composables/useCloseDialog'
import AppDialog from '@/components/AppDialog.vue'
import RudimentGrid from '@/components/RudimentGrid.vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import ErrorAlert from '@/components/ErrorAlert.vue'

const { currentRudimentId, selectRudiment } = useMetronome()
const { rudiments, isLoading, errorMessage, loadRudiments } = useRudiments()
const { closeDialog } = useCloseDialog()

// Falls jemand /rudiments direkt aufruft, ist die Liste evtl. noch nicht geladen.
// loadRudiments() tut nichts, wenn sie schon da ist.
onMounted(() => {
  loadRudiments()
})

function handleSelect(rudimentId: string) {
  selectRudiment(rudimentId)
  closeDialog()
}
</script>

<template>
  <AppDialog title="Choose rudiment" size="lg">
    <LoadingSpinner v-if="isLoading" label="Loading rudiments…" />

    <ErrorAlert
      v-else-if="errorMessage"
      :message="errorMessage"
      show-retry
      @retry="loadRudiments"
    />

    <RudimentGrid
      v-else
      :rudiments="rudiments"
      :active-rudiment-id="currentRudimentId"
      @select="handleSelect"
    />
  </AppDialog>
</template>
