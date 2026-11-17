<script setup lang="ts">
// Dialog "My sessions" unter /sessions.
// Lädt die eigenen Sessions, zeigt eine Wochenübersicht und erlaubt das Löschen
// mit Sicherheitsabfrage.
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { deleteSession, getSessions } from '@/api/sessions'
import { useRudiments } from '@/composables/useRudiments'
import { formatPracticeTime, formatShortDate } from '@/utils/format'
import type { Session } from '@/types'
import AppDialog from '@/components/AppDialog.vue'
import SessionList from '@/components/SessionList.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import ErrorAlert from '@/components/ErrorAlert.vue'
import EmptyState from '@/components/EmptyState.vue'
import { useToast } from '@/composables/useToast'

const { loadRudiments } = useRudiments()
const router = useRouter()
const { showToast } = useToast()

// Öffnet das Formular zum Nachtragen. Es ersetzt diesen Dialog,
// "Discard" oder der Zurück-Button führen hierher zurück.
function openNewSession() {
  router.push({ name: 'session-new' })
}

// Öffnet dasselbe Formular, aber mit der id der Session in der URL
function openEditSession(session: Session) {
  router.push({ name: 'session-edit', params: { sessionId: session.id } })
}

// --- Liste laden ---
const sessions = ref<Session[]>([])
const isLoading = ref(true)
const loadError = ref('')

async function loadSessions() {
  isLoading.value = true
  loadError.value = ''
  try {
    sessions.value = await getSessions()
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : 'Could not load sessions.'
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  // Die Rudiment-Namen braucht SessionCard für die Chips
  loadRudiments()
  loadSessions()
})

// --- Wochenübersicht: "4 sessions this week · 1:42 h practice" ---
const sessionsThisWeek = computed(() => {
  const oneWeekAgo = new Date()
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

  const result: Session[] = []
  for (const session of sessions.value) {
    if (new Date(session.date) >= oneWeekAgo) {
      result.push(session)
    }
  }
  return result
})

const practiceSecondsThisWeek = computed(() => {
  let total = 0
  for (const session of sessionsThisWeek.value) {
    total = total + session.durationSeconds
  }
  return total
})

const weekSummary = computed(() => {
  const count = sessionsThisWeek.value.length
  const word = count === 1 ? 'session' : 'sessions'
  return (
    count +
    ' ' +
    word +
    ' this week · ' +
    formatPracticeTime(practiceSecondsThisWeek.value) +
    ' practice'
  )
})

// --- Löschen mit Sicherheitsabfrage ---
// Die Session, die gerade gelöscht werden soll. null = keine Abfrage offen.
const sessionToDelete = ref<Session | null>(null)
const isDeleting = ref(false)
const deleteError = ref('')

// Schritt 1: Klick auf den Mülleimer öffnet nur die Abfrage
function askDelete(session: Session) {
  sessionToDelete.value = session
  deleteError.value = ''
}

function cancelDelete() {
  sessionToDelete.value = null
}

// Schritt 2: Erst "Delete" in der Abfrage löscht wirklich
async function confirmDelete() {
  const session = sessionToDelete.value
  if (session === null) {
    return
  }

  isDeleting.value = true
  deleteError.value = ''
  try {
    await deleteSession(session.id)
    showToast('Session deleted')
    // Lokal aus der Liste entfernen, statt alles neu zu laden
    sessions.value = sessions.value.filter((item) => item.id !== session.id)
    sessionToDelete.value = null
  } catch (error) {
    deleteError.value = error instanceof Error ? error.message : 'Could not delete the session.'
  } finally {
    isDeleting.value = false
  }
}
</script>

<template>
  <AppDialog title="My sessions" size="lg">
    <LoadingSpinner v-if="isLoading" label="Loading sessions…" />

    <ErrorAlert v-else-if="loadError" :message="loadError" show-retry @retry="loadSessions" />

    <template v-else>
      <div class="sessions-toolbar">
        <p class="week-summary">{{ weekSummary }}</p>
        <button type="button" class="btn btn-secondary" @click="openNewSession">
          + Add past session
        </button>
      </div>

      <EmptyState
        v-if="sessions.length === 0"
        title="No sessions yet"
        text="Start the metronome, practice and press Send Session."
      />

      <SessionList v-else :sessions="sessions" @edit="openEditSession" @delete="askDelete" />
    </template>

    <ConfirmDialog
      v-if="sessionToDelete"
      title="Delete session?"
      :message="`This removes the session from ${formatShortDate(sessionToDelete.date)}. You cannot undo this.`"
      confirm-label="Delete"
      :is-busy="isDeleting"
      :error-message="deleteError"
      @confirm="confirmDelete"
      @cancel="cancelDelete"
    />
  </AppDialog>
</template>

<style scoped>
.sessions-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.week-summary {
  margin: 0;
  color: var(--dt-text-muted);
  font-size: var(--dt-font-body-l);
}
</style>
