'use client'
import { useMemo } from 'react'
import { useAppStore } from '@/store/app.store'
import type { StoryStatus } from '@/types'

/**
 * Returns stories for a given sprint, optionally filtered by status.
 * Memoized — won't recompute unless stories or sprintId changes.
 */
export function useSprintStories(sprintId: string | undefined, filterStatus?: StoryStatus) {
  const stories = useAppStore(s => s.stories)

  return useMemo(() => {
    if (!sprintId) return []
    const filtered = stories.filter(s => s.sprintId === sprintId)
    return filterStatus ? filtered.filter(s => s.status === filterStatus) : filtered
  }, [stories, sprintId, filterStatus])
}
