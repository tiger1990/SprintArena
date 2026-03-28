'use client'
import { useAppStore } from '@/store/app.store'
import {
  canMoveStory,
  canEditStory,
  canDeleteStory,
  canAssignStory,
  canAddToSprint,
  canApproveProposal,
  canEndSprint,
  canMoveToDone,
  canProposeStory,
} from '@/lib/permissions'
import type { Story, User } from '@/types'

/**
 * Returns a permission set scoped to the current user.
 * All `can.*` functions return `false` when user is not authenticated.
 * Avoids repeating role/permission logic in every component.
 *
 * Usage:
 *   const { can } = useStoryPermissions()
 *   if (can.edit(story)) { ... }
 */
export function useStoryPermissions() {
  const currentUser = useAppStore(s => s.currentUser)

  const withUser = <T>(fn: (u: User) => T, fallback: T): T =>
    currentUser ? fn(currentUser) : fallback

  const can = {
    move: (story: Story) => withUser(u => canMoveStory(u, story), false),
    edit: (story: Story) => withUser(u => canEditStory(u, story), false),
    delete: (story: Story) => withUser(u => canDeleteStory(u, story), false),
    assign: () => withUser(u => canAssignStory(u), false),
    addToSprint: () => withUser(u => canAddToSprint(u), false),
    approveProposal: () => withUser(u => canApproveProposal(u), false),
    endSprint: () => withUser(u => canEndSprint(u), false),
    moveToDone: () => withUser(u => canMoveToDone(u), false),
    propose: () => withUser(u => canProposeStory(u), false),
  }

  return { can, currentUser }
}
