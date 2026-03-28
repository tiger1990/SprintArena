import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

import { createWorkspaceSlice } from './slices/workspaceSlice'
import { createTeamSlice } from './slices/teamSlice'
import { createSprintSlice } from './slices/sprintSlice'
import { createStorySlice } from './slices/storySlice'
import { createNotificationSlice } from './slices/notificationSlice'
import type { AppStore } from './types'

/**
 * useAppStore — composed from domain slices.
 *
 * Architecture:
 *   workspaceSlice  — workspace CRUD, settings
 *   teamSlice       — users, auth, hydration flag
 *   sprintSlice     — sprint lifecycle (planning → active → completed)
 *   storySlice      — story CRUD, AC, comments, moves
 *   notificationSlice — notifications, audit log
 *
 * Adding a new domain:
 *   1. Create src/store/slices/fooSlice.ts with FooSlice interface + createFooSlice
 *   2. Add FooSlice to AppStore in src/store/types.ts
 *   3. Spread createFooSlice(set, get, store) here
 */
export const useAppStore = create<AppStore>()(
  persist(
    (set, get, store) => ({
      // Domain slices
      ...createWorkspaceSlice(set, get, store),
      ...createTeamSlice(set, get, store),
      ...createSprintSlice(set, get, store),
      ...createStorySlice(set, get, store),
      ...createNotificationSlice(set, get, store),

      // Cross-slice state not owned by any single slice
      userBadges: [],

      // Danger zone — wipes everything including localStorage
      resetAll: () => set({
        workspace: null,
        currentUser: null,
        users: [],
        sprints: [],
        stories: [],
        notifications: [],
        userBadges: [],
        sprintResults: [],
        retrospectives: [],
        exclusions: [],
        auditLogs: [],
        _hasHydrated: false,
      }),
    }),
    {
      name: 'sprintbrain-store',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    }
  )
)
