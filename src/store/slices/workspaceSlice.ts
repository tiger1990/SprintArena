import { generateId, generateInviteCode } from '@/lib/utils'
import type { Workspace, WorkspaceSettings } from '@/types'
import type { StateCreator } from 'zustand'
import type { AppStore } from '../types'

export interface WorkspaceSlice {
  workspace: Workspace | null

  createWorkspace: (name: string, timezone: string) => Workspace
  updateWorkspaceSettings: (settings: Partial<WorkspaceSettings>) => void
}

export const createWorkspaceSlice: StateCreator<AppStore, [], [], WorkspaceSlice> = (set, get) => ({
  workspace: null,

  createWorkspace: (name, timezone) => {
    const workspace: Workspace = {
      id: generateId(),
      name,
      timezone,
      inviteCode: generateInviteCode(),
      settings: {
        sprintDurationDays: 14,
        wipLimits: { todo: 0, inProgress: 3, review: 2 },
        scoringEnabled: true,
        adminExcludedFromScoring: true,
        definitionOfDone: 'All acceptance criteria met, code reviewed, tests passing.',
        velocityWindowSprints: 3,
      },
      createdAt: new Date().toISOString(),
      createdBy: '',
    }
    set({ workspace })
    return workspace
  },

  updateWorkspaceSettings: (settings) => {
    const { workspace } = get()
    if (!workspace) return
    set({ workspace: { ...workspace, settings: { ...workspace.settings, ...settings } } })
  },
})
