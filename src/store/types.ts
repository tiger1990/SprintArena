import type { UserBadge } from '@/types'
import type { WorkspaceSlice } from './slices/workspaceSlice'
import type { TeamSlice } from './slices/teamSlice'
import type { SprintSlice } from './slices/sprintSlice'
import type { StorySlice } from './slices/storySlice'
import type { NotificationSlice } from './slices/notificationSlice'

/**
 * The complete store type is the union of all domain slices.
 * Extending this: add a new SliceX, add it here, wire it in app.store.ts.
 */
export interface AppStore
  extends WorkspaceSlice,
    TeamSlice,
    SprintSlice,
    StorySlice,
    NotificationSlice {
  /** Earned badges — written by sprintSlice.endSprint, read across the app */
  userBadges: UserBadge[]

  /** Wipe all state (settings page danger zone) */
  resetAll: () => void
}
