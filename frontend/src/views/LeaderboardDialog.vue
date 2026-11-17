<script setup lang="ts">
// Dialog "Leaderboard" unter /leaderboard.
// Filter: Rudiment, Metrik (Best BPM / Practice time), Zeitraum.
// Jeder Filterwechsel lädt die Rangliste neu. Die Berechnung macht das Backend.
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { getLeaderboard } from '@/api/leaderboard'
import { useMetronome } from '@/composables/useMetronome'
import { useRudiments } from '@/composables/useRudiments'
import type { LeaderboardEntry, Metric, Period } from '@/types'
import AppDialog from '@/components/AppDialog.vue'
import LeaderboardFilter from '@/components/LeaderboardFilter.vue'
import LeaderboardTable from '@/components/LeaderboardTable.vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import ErrorAlert from '@/components/ErrorAlert.vue'
import { getErrorMessage } from '@/utils/errors'

const router = useRouter()
const { currentRudimentId } = useMetronome()
const { rudiments, loadRudiments, findRudiment } = useRudiments()

// ---------- Filter ----------
const metric = ref<Metric>('bpm')
const period = ref<Period>('week')
// undefined heißt "alle Rudimente". Das gibt es nur bei Practice time.
// Start: das Rudiment, das gerade im Metronom gewählt ist.
const rudimentId = ref<string | undefined>(undefined)
if (currentRudimentId.value !== null) {
  rudimentId.value = currentRudimentId.value
}

// Die Reihenfolge, in der < und > durchschalten
const rudimentChoices = computed(() => {
  const choices: (string | undefined)[] = []
  if (metric.value === 'duration') {
    choices.push(undefined) // "All rudiments" als erste Option
  }
  for (const rudiment of rudiments.value) {
    choices.push(rudiment.id)
  }
  return choices
})

// direction: +1 = nächstes, -1 = vorheriges. Am Ende geht es vorne weiter.
function switchRudiment(direction: number) {
  const choices = rudimentChoices.value
  if (choices.length === 0) {
    return
  }
  const index = choices.indexOf(rudimentId.value)
  const nextIndex = (index + direction + choices.length) % choices.length
  rudimentId.value = choices[nextIndex]
}

const rudimentLabel = computed(() => {
  if (rudimentId.value === undefined) {
    return 'All rudiments'
  }
  const rudiment = findRudiment(rudimentId.value)
  if (rudiment === undefined) {
    return rudimentId.value
  }
  return rudiment.name
})

// Das Rudiment des Metronoms oder, falls keins gewählt ist, das erste der Liste
function currentOrFirstRudimentId(): string | undefined {
  if (currentRudimentId.value !== null) {
    return currentRudimentId.value
  }
  const first = rudiments.value[0]
  if (first === undefined) {
    return undefined
  }
  return first.id
}

// Best BPM braucht ein bestimmtes Rudiment (wie im Backend).
// Steht beim Wechsel auf Best BPM "All rudiments", nehmen wir das aktuelle bzw. erste.
watch(metric, (newMetric) => {
  if (newMetric === 'bpm' && rudimentId.value === undefined) {
    rudimentId.value = currentOrFirstRudimentId()
  }
})

// ---------- Rangliste laden ----------
const entries = ref<LeaderboardEntry[]>([])
const isLoading = ref(false)
const loadError = ref('')

// Zählt die Anfragen mit. Schaltet jemand schnell durch die Filter, kommen
// die Antworten evtl. in falscher Reihenfolge zurück. Nur die neueste zählt.
let latestRequest = 0

async function loadLeaderboard() {
  if (metric.value === 'bpm' && rudimentId.value === undefined) {
    return
  }

  latestRequest = latestRequest + 1
  const thisRequest = latestRequest
  isLoading.value = true
  loadError.value = ''

  try {
    const result = await getLeaderboard({
      metric: metric.value,
      period: period.value,
      rudimentId: rudimentId.value,
    })
    if (thisRequest === latestRequest) {
      entries.value = result
    }
  } catch (error) {
    if (thisRequest === latestRequest) {
      loadError.value = getErrorMessage(error, 'Could not load the leaderboard.')
    }
  } finally {
    if (thisRequest === latestRequest) {
      isLoading.value = false
    }
  }
}

// watch: Ändert sich einer der drei Filter, lädt die Rangliste neu
watch([metric, period, rudimentId], loadLeaderboard)

onMounted(async () => {
  await loadRudiments()
  if (rudimentId.value === undefined && metric.value === 'bpm') {
    // Setzen löst den watch oben aus, der lädt dann
    rudimentId.value = currentOrFirstRudimentId()
  } else {
    loadLeaderboard()
  }
})

// Nur man selbst in der Liste: Hinweis auf Freunde
const hasNoFriends = computed(() => entries.value.length === 1)

function openFriends() {
  router.push({ name: 'friends' })
}
</script>

<template>
  <AppDialog title="Leaderboard" size="lg">
    <div class="leaderboard-content">
      <!-- Die Filter nehmen die volle Breite ein. "Add Friend" kommt über den
           Slot "actions" in die obere Zeile des Filters, rechts neben den Rudiment-Wechsler. -->
      <LeaderboardFilter
        v-model:metric="metric"
        v-model:period="period"
        :rudiment-label="rudimentLabel"
        @previous-rudiment="switchRudiment(-1)"
        @next-rudiment="switchRudiment(1)"
      >
        <template #actions>
          <button type="button" class="btn btn-primary add-friend" @click="openFriends">
            Add Friend
          </button>
        </template>
      </LeaderboardFilter>

      <ErrorAlert v-if="loadError" :message="loadError" show-retry @retry="loadLeaderboard" />

      <!-- Spinner nur beim ersten Laden. Danach bleibt die alte Liste
           sichtbar und wird nur kurz blasser, das flackert weniger. -->
      <LoadingSpinner v-else-if="isLoading && entries.length === 0" />

      <div v-else :class="{ 'is-refreshing': isLoading }">
        <LeaderboardTable :entries="entries" :metric="metric" />
        <p v-if="hasNoFriends" class="text-secondary text-center mt-3 mb-0">
          Add friends to compare yourselves.
        </p>
      </div>
    </div>
  </AppDialog>
</template>

<style scoped>
.leaderboard-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.add-friend {
  flex-shrink: 0;
}

.is-refreshing {
  opacity: 0.6;
  transition: opacity 0.15s;
}
</style>
