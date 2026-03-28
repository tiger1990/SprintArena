'use client'
import { useAppStore } from '@/store/app.store'

/**
 * Returns the currently authenticated user and hydration state.
 * Use `isHydrated` to gate role-sensitive UI — never show admin controls
 * until the store has rehydrated from localStorage.
 */
export function useCurrentUser() {
  const currentUser = useAppStore(s => s.currentUser)
  const isHydrated = useAppStore(s => s._hasHydrated)

  return {
    user: currentUser,
    isAdmin: currentUser?.role === 'admin',
    isAssignee: currentUser?.role === 'assignee',
    isAuthenticated: currentUser !== null,
    isHydrated,
  }
}
