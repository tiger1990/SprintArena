'use client'
import { useMemo } from 'react'
import { useAppStore } from '@/store/app.store'
import type { Story } from '@/types'

/**
 * Derives the active sprint and its stories in a single subscription.
 * Components using this hook only re-render when sprints or stories change —
 * not on every unrelated store mutation.
 */
export function useActiveSprint() {
  const sprints = useAppStore(s => s.sprints)
  const stories = useAppStore(s => s.stories)

  const activeSprint = useMemo(
    () => sprints.find(s => s.status === 'active') ?? null,
    [sprints]
  )

  const sprintStories = useMemo((): Story[] => {
    if (!activeSprint) return []
    return stories.filter(s => s.sprintId === activeSprint.id)
  }, [activeSprint, stories])

  const completedCount = useMemo(
    () => sprintStories.filter(s => s.status === 'done').length,
    [sprintStories]
  )

  const totalCount = sprintStories.length

  const completionPercent = totalCount > 0
    ? Math.round((completedCount / totalCount) * 100)
    : 0

  return {
    sprint: activeSprint,
    stories: sprintStories,
    completedCount,
    totalCount,
    completionPercent,
    hasActiveSprint: activeSprint !== null,
  }
}
