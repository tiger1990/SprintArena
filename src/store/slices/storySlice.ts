import { generateId } from '@/lib/utils'
import type { Story, StoryStatus, AcceptanceCriterion, StoryComment } from '@/types'
import type { StateCreator } from 'zustand'
import type { AppStore } from '../types'

export interface StorySlice {
  stories: Story[]

  createStory: (
    data: Omit<Story, 'id' | 'createdAt' | 'updatedAt' | 'orderIndex' | 'acceptanceCriteria' | 'comments' | 'tags'>
      & { tags?: string[]; acceptanceCriteria?: string[] }
  ) => Story
  updateStory: (id: string, data: Partial<Story>) => void
  deleteStory: (id: string) => void
  moveStory: (storyId: string, newStatus: StoryStatus, movedBy: string) => void
  assignStory: (storyId: string, assigneeId: string) => void
  approveProposal: (storyId: string, adminId: string) => void
  rejectProposal: (storyId: string, adminId: string, note: string) => void
  addToSprint: (storyId: string, sprintId: string) => void
  toggleAC: (storyId: string, acId: string, userId: string) => void
  addAC: (storyId: string, text: string) => void
  removeAC: (storyId: string, acId: string) => void
  addComment: (storyId: string, userId: string, body: string, isBlocker?: boolean) => void
  getSprintStories: (sprintId: string) => Story[]
  getBacklogStories: () => Story[]
  getProposedStories: () => Story[]
}

export const createStorySlice: StateCreator<AppStore, [], [], StorySlice> = (set, get) => ({
  stories: [],

  createStory: (data) => {
    const { acceptanceCriteria: acTexts, tags, ...rest } = data as typeof data & { acceptanceCriteria?: string[] }
    const storyId = generateId()
    const now = new Date().toISOString()
    const story: Story = {
      ...rest,
      id: storyId,
      tags: tags ?? [],
      acceptanceCriteria: (acTexts ?? []).map((text, i) => ({
        id: generateId(),
        storyId,
        text,
        isMet: false,
        orderIndex: i,
      })),
      comments: [],
      orderIndex: get().stories.length,
      createdAt: now,
      updatedAt: now,
    }
    set(s => ({ stories: [...s.stories, story] }))
    return story
  },

  updateStory: (id, data) => {
    set(s => ({
      stories: s.stories.map(st =>
        st.id === id ? { ...st, ...data, updatedAt: new Date().toISOString() } : st
      ),
    }))
  },

  deleteStory: (id) => {
    set(s => ({ stories: s.stories.filter(st => st.id !== id) }))
  },

  moveStory: (storyId, newStatus, movedBy) => {
    const now = new Date().toISOString()
    set(s => ({
      stories: s.stories.map(st => {
        if (st.id !== storyId) return st
        return {
          ...st,
          status: newStatus,
          completedAt: newStatus === 'done' ? now : st.completedAt,
          completedBy: newStatus === 'done' ? movedBy : st.completedBy,
          updatedAt: now,
        }
      }),
    }))
    get().addAuditLog({
      workspaceId: get().workspace?.id ?? '',
      userId: movedBy,
      action: 'story.moved',
      entityType: 'story',
      entityId: storyId,
      newValue: { status: newStatus },
    })
  },

  assignStory: (storyId, assigneeId) => {
    set(s => ({
      stories: s.stories.map(st =>
        st.id === storyId ? { ...st, assigneeId, updatedAt: new Date().toISOString() } : st
      ),
    }))
    const story = get().stories.find(s => s.id === storyId)
    if (story) {
      get().addNotification({
        workspaceId: story.workspaceId,
        userId: assigneeId,
        type: 'assignment',
        title: 'Story assigned to you',
        body: `"${story.title}" has been assigned to you.`,
        actionUrl: '/board',
        metadata: { storyId },
      })
    }
  },

  approveProposal: (storyId, adminId) => {
    set(s => ({
      stories: s.stories.map(st =>
        st.id === storyId
          ? { ...st, status: 'backlog', approvedBy: adminId, updatedAt: new Date().toISOString() }
          : st
      ),
    }))
    const story = get().stories.find(s => s.id === storyId)
    if (story?.createdBy) {
      get().addNotification({
        workspaceId: story.workspaceId,
        userId: story.createdBy,
        type: 'approval',
        title: 'Your story was approved ✅',
        body: `"${story.title}" has been approved and added to the backlog.`,
        actionUrl: '/backlog',
        metadata: { storyId },
      })
    }
  },

  rejectProposal: (storyId, adminId, note) => {
    set(s => ({
      stories: s.stories.map(st =>
        st.id === storyId
          ? { ...st, rejectedBy: adminId, rejectionNote: note, updatedAt: new Date().toISOString() }
          : st
      ),
    }))
    const story = get().stories.find(s => s.id === storyId)
    if (story?.createdBy) {
      get().addNotification({
        workspaceId: story.workspaceId,
        userId: story.createdBy,
        type: 'rejection',
        title: 'Story update from admin',
        body: note || `"${story.title}" was not approved.`,
        metadata: { storyId },
      })
    }
  },

  addToSprint: (storyId, sprintId) => {
    const sprint = get().sprints.find(s => s.id === sprintId)
    if (!sprint || sprint.status === 'completed' || sprint.status === 'review') {
      console.warn(`[addToSprint] Cannot add story to sprint in state "${sprint?.status ?? 'not found'}"`)
      return
    }
    set(s => ({
      stories: s.stories.map(st =>
        st.id === storyId
          ? { ...st, sprintId, status: 'todo', updatedAt: new Date().toISOString() }
          : st
      ),
    }))
  },

  toggleAC: (storyId, acId, userId) => {
    const now = new Date().toISOString()
    set(s => ({
      stories: s.stories.map(st => {
        if (st.id !== storyId) return st
        return {
          ...st,
          acceptanceCriteria: st.acceptanceCriteria.map(ac => {
            if (ac.id !== acId) return ac
            return {
              ...ac,
              isMet: !ac.isMet,
              metBy: !ac.isMet ? userId : undefined,
              metAt: !ac.isMet ? now : undefined,
            }
          }),
          updatedAt: now,
        }
      }),
    }))
  },

  addAC: (storyId, text) => {
    set(s => ({
      stories: s.stories.map(st => {
        if (st.id !== storyId) return st
        const ac: AcceptanceCriterion = {
          id: generateId(),
          storyId,
          text,
          isMet: false,
          orderIndex: st.acceptanceCriteria.length,
        }
        return { ...st, acceptanceCriteria: [...st.acceptanceCriteria, ac], updatedAt: new Date().toISOString() }
      }),
    }))
  },

  removeAC: (storyId, acId) => {
    set(s => ({
      stories: s.stories.map(st => {
        if (st.id !== storyId) return st
        return { ...st, acceptanceCriteria: st.acceptanceCriteria.filter(ac => ac.id !== acId) }
      }),
    }))
  },

  addComment: (storyId, userId, body, isBlocker = false) => {
    const comment: StoryComment = {
      id: generateId(),
      storyId,
      userId,
      body,
      isBlocker,
      createdAt: new Date().toISOString(),
    }
    set(s => ({
      stories: s.stories.map(st => {
        if (st.id !== storyId) return st
        return { ...st, comments: [...st.comments, comment], updatedAt: new Date().toISOString() }
      }),
    }))
  },

  getSprintStories: (sprintId) => get().stories.filter(s => s.sprintId === sprintId),
  getBacklogStories: () => get().stories.filter(s => s.status === 'backlog' && !s.sprintId),
  getProposedStories: () => get().stories.filter(s => s.status === 'proposed'),
})
