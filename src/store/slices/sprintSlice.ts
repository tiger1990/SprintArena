import { generateId } from '@/lib/utils'
import { calculateSprintScores } from '@/lib/scoring/engine'
import type { Sprint, SprintResult, UserBadge, SprintExclusion, Retrospective } from '@/types'
import type { StateCreator } from 'zustand'
import type { AppStore } from '../types'

export interface SprintSlice {
  sprints: Sprint[]
  sprintResults: SprintResult[]
  exclusions: SprintExclusion[]
  retrospectives: Retrospective[]

  createSprint: (data: Omit<Sprint, 'id' | 'createdAt' | 'velocityPoints' | 'status'>) => Sprint
  updateSprint: (id: string, data: Partial<Sprint>) => void
  startSprint: (id: string) => void
  endSprint: (id: string, spilledStoryIds: string[]) => { results: SprintResult[]; badges: UserBadge[] }
  addExclusion: (sprintId: string, userId: string, reason: string, addedBy: string) => void
  removeExclusion: (sprintId: string, userId: string) => void
  saveRetrospective: (data: Omit<Retrospective, 'id' | 'createdAt' | 'updatedAt'>) => void
  getActiveSprint: () => Sprint | null
}

export const createSprintSlice: StateCreator<AppStore, [], [], SprintSlice> = (set, get) => ({
  sprints: [],
  sprintResults: [],
  exclusions: [],
  retrospectives: [],

  createSprint: (data) => {
    const sprint: Sprint = {
      ...data,
      id: generateId(),
      status: 'planning',
      velocityPoints: 0,
      createdAt: new Date().toISOString(),
    }
    set(s => ({ sprints: [...s.sprints, sprint] }))
    return sprint
  },

  updateSprint: (id, data) => {
    set(s => ({ sprints: s.sprints.map(sp => sp.id === id ? { ...sp, ...data } : sp) }))
  },

  startSprint: (id) => {
    const { sprints } = get()
    const sprint = sprints.find(s => s.id === id)

    if (!sprint || sprint.status !== 'planning') {
      console.warn(`[startSprint] Invalid transition: sprint "${id}" is in state "${sprint?.status ?? 'not found'}"`)
      return
    }
    const alreadyActive = sprints.find(s => s.status === 'active')
    if (alreadyActive) {
      console.warn(`[startSprint] Cannot start sprint — "${alreadyActive.name}" is already active`)
      return
    }

    set(s => ({
      sprints: s.sprints.map(sp =>
        sp.id === id ? { ...sp, status: 'active', startedAt: new Date().toISOString() } : sp
      ),
    }))

    get().addNotification({
      workspaceId: sprint.workspaceId,
      userId: undefined,
      type: 'sprint_start',
      title: `Sprint "${sprint.name}" has started!`,
      body: 'Head to the board to see your assigned stories.',
      actionUrl: '/board',
      metadata: { sprintId: id },
    })
  },

  endSprint: (id, spilledStoryIds) => {
    const { stories, users, exclusions, workspace } = get()
    const sprint = get().sprints.find(s => s.id === id)

    if (!sprint || sprint.status !== 'active') {
      console.warn(`[endSprint] Invalid transition: sprint "${id}" is in state "${sprint?.status ?? 'not found'}"`)
      return { results: [], badges: [] }
    }
    if (!workspace) return { results: [], badges: [] }

    const now = new Date().toISOString()

    const updatedStories = stories.map(s =>
      spilledStoryIds.includes(s.id)
        ? { ...s, status: 'spilled' as const, spilledFrom: id }
        : s
    )

    const completedPoints = updatedStories
      .filter(s => s.sprintId === id && s.status === 'done')
      .reduce((sum, s) => sum + s.storyPoints, 0)

    const sprintExclusions = exclusions.filter(e => e.sprintId === id)
    const { results, badges } = calculateSprintScores(
      sprint, updatedStories, users, sprintExclusions, workspace.settings,
      get().sprintResults // historical results for streak/comeback badges
    )

    set(s => ({
      stories: updatedStories,
      sprints: s.sprints.map(sp =>
        sp.id === id ? { ...sp, status: 'completed', velocityPoints: completedPoints, endedAt: now } : sp
      ),
      sprintResults: [...s.sprintResults, ...results],
      userBadges: [...s.userBadges, ...badges],
    }))

    const winner = results.find(r => r.isWinner)
    const winnerUser = winner ? users.find(u => u.id === winner.userId) : null

    get().addNotification({
      workspaceId: sprint.workspaceId,
      type: 'sprint_end',
      title: `Sprint "${sprint.name}" has ended!`,
      body: winnerUser ? `🏆 ${winnerUser.name} is the Sprint MVP!` : 'Results are in.',
      actionUrl: `/sprints/${id}/winner`,
      metadata: { sprintId: id, winnerId: winner?.userId },
    })

    return { results, badges }
  },

  addExclusion: (sprintId, userId, reason, addedBy) => {
    const exclusion: SprintExclusion = { id: generateId(), sprintId, userId, reason, addedBy }
    set(s => ({ exclusions: [...s.exclusions, exclusion] }))
  },

  removeExclusion: (sprintId, userId) => {
    set(s => ({ exclusions: s.exclusions.filter(e => !(e.sprintId === sprintId && e.userId === userId)) }))
  },

  saveRetrospective: (data) => {
    const now = new Date().toISOString()
    const existing = get().retrospectives.find(r => r.sprintId === data.sprintId)
    if (existing) {
      set(s => ({
        retrospectives: s.retrospectives.map(r =>
          r.sprintId === data.sprintId ? { ...r, ...data, updatedAt: now } : r
        ),
      }))
    } else {
      const retro: Retrospective = { ...data, id: generateId(), createdAt: now, updatedAt: now }
      set(s => ({ retrospectives: [...s.retrospectives, retro] }))
    }
  },

  getActiveSprint: () => get().sprints.find(s => s.status === 'active') ?? null,
})
