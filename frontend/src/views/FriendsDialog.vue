<script setup lang="ts">
// Dialog "Friends" unter /friends.
// Drei Bereiche: eigenes Profil (Name, Code), Freund hinzufügen, Freundesliste.
// Dieser Dialog spricht mit dem Backend, die Kindkomponenten zeigen nur an und melden.
import { onMounted, onUnmounted, ref } from 'vue'
import { getMe, renameMe } from '@/api/players'
import { addFriend, getFriends, removeFriend } from '@/api/friends'
import type { Player, PublicPlayer } from '@/types'
import AppDialog from '@/components/AppDialog.vue'
import ProfileForm from '@/components/ProfileForm.vue'
import FriendCodeCard from '@/components/FriendCodeCard.vue'
import AddFriendForm from '@/components/AddFriendForm.vue'
import FriendList from '@/components/FriendList.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import ErrorAlert from '@/components/ErrorAlert.vue'
import EmptyState from '@/components/EmptyState.vue'
import { useToast } from '@/composables/useToast'
import { getErrorMessage } from '@/utils/errors'

const { showToast } = useToast()

// ---------- Laden ----------
const player = ref<Player | null>(null)
const friends = ref<PublicPlayer[]>([])
const isLoading = ref(true)
const loadError = ref('')

async function loadAll() {
  isLoading.value = true
  loadError.value = ''
  try {
    // Promise.all startet beide Anfragen gleichzeitig und wartet auf beide.
    // Das ist schneller als nacheinander.
    const [me, friendList] = await Promise.all([getMe(), getFriends()])
    player.value = me
    nameInput.value = me.name
    friends.value = friendList
  } catch (error) {
    loadError.value = getErrorMessage(error, 'Could not load your friends.')
  } finally {
    isLoading.value = false
  }
}

onMounted(loadAll)

// ---------- Namen ändern (Update im CRUD) ----------
const nameInput = ref('')
const isRenaming = ref(false)
const renameError = ref('')
const justRenamed = ref(false)
let justRenamedTimer: number | undefined = undefined

async function saveName() {
  isRenaming.value = true
  renameError.value = ''
  try {
    player.value = await renameMe(nameInput.value.trim())
    nameInput.value = player.value.name
    // "Name saved." für 3 Sekunden anzeigen
    justRenamed.value = true
    window.clearTimeout(justRenamedTimer)
    justRenamedTimer = window.setTimeout(() => {
      justRenamed.value = false
    }, 3000)
  } catch (error) {
    renameError.value = getErrorMessage(error, 'Could not save your name.')
  } finally {
    isRenaming.value = false
  }
}

onUnmounted(() => {
  window.clearTimeout(justRenamedTimer)
})

// ---------- Freund hinzufügen ----------
const codeInput = ref('')
const isAdding = ref(false)
const addError = ref('')

async function handleAdd() {
  isAdding.value = true
  addError.value = ''
  try {
    const newFriend = await addFriend(codeInput.value.trim())
    friends.value.push(newFriend)
    codeInput.value = ''
    showToast(newFriend.name + ' added as friend')
  } catch (error) {
    // Das Backend liefert passende Meldungen für 404 (Code unbekannt)
    // und 409 (schon befreundet, eigener Code)
    addError.value = getErrorMessage(error, 'Could not add this friend.')
  } finally {
    isAdding.value = false
  }
}

// ---------- Freund entfernen, mit Sicherheitsabfrage ----------
const friendToRemove = ref<PublicPlayer | null>(null)
const isRemoving = ref(false)
const removeError = ref('')

function askRemove(friend: PublicPlayer) {
  friendToRemove.value = friend
  removeError.value = ''
}

function cancelRemove() {
  friendToRemove.value = null
}

async function confirmRemove() {
  const friend = friendToRemove.value
  if (friend === null) {
    return
  }
  isRemoving.value = true
  removeError.value = ''
  try {
    await removeFriend(friend.friendCode)
    friends.value = friends.value.filter((item) => item.friendCode !== friend.friendCode)
    friendToRemove.value = null
    showToast(friend.name + ' removed')
  } catch (error) {
    removeError.value = getErrorMessage(error, 'Could not remove this friend.')
  } finally {
    isRemoving.value = false
  }
}
</script>

<template>
  <AppDialog title="Friends">
    <LoadingSpinner v-if="isLoading" />

    <ErrorAlert v-else-if="loadError" :message="loadError" show-retry @retry="loadAll" />

    <div v-else-if="player" class="friends-content">
      <section aria-labelledby="profile-heading">
        <h3 id="profile-heading" class="section-heading">Your profile</h3>
        <ProfileForm
          v-model:name="nameInput"
          :saved-name="player.name"
          :is-saving="isRenaming"
          :error-message="renameError"
          :just-saved="justRenamed"
          @save="saveName"
        />
        <p class="field-label mt-3 mb-2">Your friend code</p>
        <FriendCodeCard :friend-code="player.friendCode" />
      </section>

      <hr />

      <section aria-labelledby="add-heading">
        <h3 id="add-heading" class="section-heading">Add friend</h3>
        <AddFriendForm
          v-model:code="codeInput"
          :is-adding="isAdding"
          :error-message="addError"
          @add="handleAdd"
        />
      </section>

      <section aria-labelledby="list-heading">
        <h3 id="list-heading" class="section-heading">Your friends ({{ friends.length }})</h3>
        <EmptyState
          v-if="friends.length === 0"
          title="No friends yet"
          text="Share your code or add a friend with theirs."
        />
        <FriendList v-else :friends="friends" @remove="askRemove" />
      </section>
    </div>

    <ConfirmDialog
      v-if="friendToRemove"
      :title="`Remove ${friendToRemove.name}?`"
      message="You will no longer see each other on the leaderboard. You can add each other again later."
      confirm-label="Remove"
      :is-busy="isRemoving"
      :error-message="removeError"
      @confirm="confirmRemove"
      @cancel="cancelRemove"
    />
  </AppDialog>
</template>

<style scoped>
.friends-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.section-heading {
  margin-bottom: 0.75rem;
  font-size: var(--dt-font-caption);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--dt-text-muted);
}

hr {
  margin: 0;
  border-color: var(--dt-border);
  opacity: 1;
}
</style>
