import { generateId } from '@/lib/utils'
import type { User } from '@/types'
import type { StateCreator } from 'zustand'
import type { AppStore } from '../types'

export interface TeamSlice {
  currentUser: User | null
  users: User[]
  _hasHydrated: boolean

  login: (userId: string) => void
  logout: () => void
  setHasHydrated: (v: boolean) => void
  createUser: (data: Omit<User, 'id' | 'createdAt' | 'isActive'>) => User
  updateUser: (id: string, data: Partial<User>) => void
  joinWorkspace: (inviteCode: string, userData: Omit<User, 'id' | 'createdAt' | 'isActive' | 'workspaceId' | 'role'>) => User | null
  getUserById: (id: string) => User | undefined
}

export const createTeamSlice: StateCreator<AppStore, [], [], TeamSlice> = (set, get) => ({
  currentUser: null,
  users: [],
  _hasHydrated: false,

  login: (userId) => {
    const user = get().users.find(u => u.id === userId)
    if (user) set({ currentUser: user })
  },

  logout: () => set({ currentUser: null }),

  setHasHydrated: (v) => set({ _hasHydrated: v }),

  createUser: (data) => {
    const user: User = {
      ...data,
      id: generateId(),
      isActive: true,
      createdAt: new Date().toISOString(),
    }
    set(s => ({ users: [...s.users, user] }))
    return user
  },

  updateUser: (id, data) => {
    set(s => ({
      users: s.users.map(u => u.id === id ? { ...u, ...data } : u),
      currentUser: s.currentUser?.id === id ? { ...s.currentUser, ...data } : s.currentUser,
    }))
  },

  joinWorkspace: (inviteCode, userData) => {
    const { workspace } = get()
    if (!workspace || workspace.inviteCode !== inviteCode) return null
    const user: User = {
      ...userData,
      id: generateId(),
      role: 'assignee',
      workspaceId: workspace.id,
      isActive: true,
      createdAt: new Date().toISOString(),
    }
    set(s => ({ users: [...s.users, user] }))
    return user
  },

  getUserById: (id) => get().users.find(u => u.id === id),
})
