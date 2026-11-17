import { createRouter, createWebHistory } from 'vue-router'
import { getPlayerId } from '@/api/playerId'
import OnboardingView from '@/views/OnboardingView.vue'
import MetronomeView from '@/views/MetronomeView.vue'
import RudimentDialog from '@/views/RudimentDialog.vue'
import SessionsDialog from '@/views/SessionsDialog.vue'
import FriendsDialog from '@/views/FriendsDialog.vue'
import LeaderboardDialog from '@/views/LeaderboardDialog.vue'
import TempoDialog from '@/views/TempoDialog.vue'
import SessionFormDialog from '@/views/SessionFormDialog.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // Erster Start: Namen eingeben
    { path: '/welcome', name: 'welcome', component: OnboardingView },

    // Der Übe-Bildschirm. Die Dialoge sind Kind-Routen:
    // MetronomeView bleibt angezeigt, der Dialog erscheint in dessen <RouterView>.
    // So läuft das Metronom weiter, während ein Dialog offen ist.
    {
      path: '/',
      name: 'metronome',
      component: MetronomeView,
      children: [
        { path: 'rudiments', name: 'rudiments', component: RudimentDialog },
        { path: 'tempo', name: 'tempo', component: TempoDialog },
        { path: 'leaderboard', name: 'leaderboard', component: LeaderboardDialog },
        { path: 'friends', name: 'friends', component: FriendsDialog },
        { path: 'sessions', name: 'sessions', component: SessionsDialog },
        { path: 'sessions/new', name: 'session-new', component: SessionFormDialog },
        // :sessionId ist ein Platzhalter. props: true reicht den Wert als Prop
        // an SessionFormDialog weiter.
        {
          path: 'sessions/:sessionId/edit',
          name: 'session-edit',
          component: SessionFormDialog,
          props: true,
        },
      ],
    },

    // Unbekannte URL: zurück zum Übe-Bildschirm
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

// Navigation Guard: läuft vor JEDEM Seitenwechsel.
// Die Rückgabe entscheidet, wohin es geht:
//   true          → Seitenwechsel wie geplant
//   { name: … }   → stattdessen auf diese Route umleiten
router.beforeEach((to) => {
  const hasPlayer = getPlayerId() !== null

  // Noch kein Spieler angelegt: alles führt zum Onboarding
  if (!hasPlayer && to.name !== 'welcome') {
    return { name: 'welcome' }
  }

  // Spieler existiert schon: Onboarding überspringen
  if (hasPlayer && to.name === 'welcome') {
    return { name: 'metronome' }
  }

  return true
})

export default router
