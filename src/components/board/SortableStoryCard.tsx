'use client'
import type { Story } from '@/types'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { StoryCard } from './StoryCard'
import { useAppStore } from '@/store/app.store'
import { canMoveStory } from '@/lib/permissions'

export function SortableStoryCard({ story }: { story: Story }) {
  const { currentUser } = useAppStore()
  const canMove = currentUser ? canMoveStory(currentUser, story) : false

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: story.id,
    disabled: !canMove,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <StoryCard story={story} isDragging={isDragging} />
    </div>
  )
}
