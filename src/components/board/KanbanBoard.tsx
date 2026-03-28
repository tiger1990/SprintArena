'use client'
import { useState } from 'react'
import type { Sprint, Story, StoryStatus } from '@/types'
import { useAppStore } from '@/store/app.store'
import { useTheme } from '@/hooks/useTheme'
import { KanbanColumn } from './KanbanColumn'
import {
  DndContext, DragEndEvent, PointerSensor,
  TouchSensor, useSensor, useSensors, DragOverlay,
} from '@dnd-kit/core'
import { StoryCard } from './StoryCard'
import { COLUMN_STATUSES, STATUS_LABELS } from '@/types'
import { canMoveStory } from '@/lib/permissions'
import { toast } from 'sonner'

export function KanbanBoard({ sprint }: { sprint: Sprint }) {
  const { spacing: SP } = useTheme()
  const { stories, currentUser, moveStory } = useAppStore()
  const [activeStory, setActiveStory] = useState<Story | null>(null)

  const sprintStories = stories.filter(s => s.sprintId === sprint.id)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor,   { activationConstraint: { delay: 200, tolerance: 5 } })
  )

  const handleDragStart = (event: DragEndEvent) => {
    const story = sprintStories.find(s => s.id === event.active.id)
    setActiveStory(story ?? null)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveStory(null)
    if (!over || !currentUser) return

    const story = sprintStories.find(s => s.id === active.id)
    if (!story) return

    if (!canMoveStory(currentUser, story)) {
      toast.error('You can only move your own stories')
      return
    }

    // over.id is either a column status (dropped on empty column space)
    // or a story id (dropped on top of another card via SortableContext).
    // Resolve both cases to a target column status.
    let newStatus: StoryStatus
    if (COLUMN_STATUSES.includes(over.id as StoryStatus)) {
      newStatus = over.id as StoryStatus
    } else {
      const overStory = sprintStories.find(s => s.id === over.id)
      if (!overStory) return
      newStatus = overStory.status
    }

    if (newStatus !== story.status) {
      moveStory(story.id, newStatus, currentUser.id)
      toast.success(`Moved to ${STATUS_LABELS[newStatus]}`)
    }
  }

  const columns = COLUMN_STATUSES.map(status => ({
    status,
    title: STATUS_LABELS[status],
    stories: sprintStories.filter(s => s.status === status),
  }))

  return (
    <div style={{
      padding: `0 ${SP[6]} ${SP[6]}`,
      overflowX: 'auto',
    }}>
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div style={{
          display: 'flex',
          gap: SP[3],
          minWidth: 'max-content',
          alignItems: 'flex-start',
        }}>
          {columns.map(col => (
            <div key={col.status} style={{ flex: '1 1 260px', minWidth: '220px', maxWidth: '320px' }}>
              <KanbanColumn
                id={col.status}
                title={col.title}
                stories={col.stories}
                count={col.stories.length}
              />
            </div>
          ))}
        </div>

        <DragOverlay>
          {activeStory && <StoryCard story={activeStory} isDragging />}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
