'use client'
import { useState } from 'react'
import type { Story, StoryStatus } from '@/types'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { SortableStoryCard } from './SortableStoryCard'
import { useTheme } from '@/hooks/useTheme'
import { Circle, Eye, CheckCircle2, Plus, MoreHorizontal } from 'lucide-react'

// ─── Column config ────────────────────────────────────────────────────────────

interface ColConfig {
  label: string
  icon: (color: string) => React.ReactNode
  color: string
  topColor: string
  emptyText: string
}

function buildColConfig(C: any): Record<StoryStatus, ColConfig> {
  return {
    todo: {
      label: 'To Do',
      icon: (color) => <Circle size={13} color={color} />,
      color: C.text.secondary,
      topColor: C.border.strong,
      emptyText: 'No tasks yet — drag or add a story',
    },
    in_progress: {
      label: 'In Progress',
      icon: () => (
        <div style={{
          width: '13px', height: '13px', borderRadius: '9999px',
          border: '2px solid #60a5fa', borderTopColor: 'transparent',
          animation: 'spin 0.8s linear infinite',
        }} className="animate-spin" />
      ),
      color: '#60a5fa',
      topColor: '#60a5fa',
      emptyText: 'Nothing in progress',
    },
    review: {
      label: 'Review',
      icon: (color) => <Eye size={13} color={color} />,
      color: '#f97316',
      topColor: '#f97316',
      emptyText: 'Nothing under review',
    },
    done: {
      label: 'Done',
      icon: (color) => <CheckCircle2 size={13} color={color} />,
      color: '#4ade80',
      topColor: '#4ade80',
      emptyText: 'No completed stories yet',
    },
    // unused statuses — satisfy TS
    proposed: { label: 'Proposed', icon: () => null, color: '', topColor: '', emptyText: '' },
    backlog:   { label: 'Backlog',  icon: () => null, color: '', topColor: '', emptyText: '' },
    spilled:   { label: 'Spilled',  icon: () => null, color: '', topColor: '', emptyText: '' },
  }
}

interface KanbanColumnProps {
  id: StoryStatus
  title: string
  stories: Story[]
  count: number
  onAddStory?: () => void
}

export function KanbanColumn({ id, title, stories, count, onAddStory }: KanbanColumnProps) {
  const { colors: C, typography: TY, spacing: SP, radius: R, transitions } = useTheme()
  const { setNodeRef, isOver } = useDroppable({ id })
  const cfg = buildColConfig(C)[id]

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      borderRadius: R.xl,
      border: `1px solid ${isOver ? `${C.accent.DEFAULT}66` : C.border.DEFAULT}`,
      borderTop: `2px solid ${isOver ? C.accent.DEFAULT : cfg.topColor}`,
      backgroundColor: isOver ? `${C.accent.DEFAULT}08` : C.card.DEFAULT,
      transition: `border-color ${transitions.fast}, background-color ${transitions.fast}`,
      overflow: 'hidden',
    }}>

      {/* ── Column header ───────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: `${SP[3]} ${SP[4]}`,
        borderBottom: `1px solid ${C.border.subtle}`,
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: SP[2] }}>
          {cfg.icon(cfg.color)}
          <span style={{
            fontSize: TY.fontSize.sm, fontWeight: TY.fontWeight.semibold,
            color: cfg.color,
          }}>
            {cfg.label}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: SP[1.5] }}>
          {/* Count badge */}
          <span style={{
            minWidth: '22px', height: '22px',
            borderRadius: '9999px',
            backgroundColor: `${cfg.color}18`,
            color: cfg.color,
            fontSize: TY.fontSize['2xs'],
            fontWeight: TY.fontWeight.bold,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: `0 ${SP[1]}`,
          }}>
            {count}
          </span>
          {/* Column actions (visual, non-functional) */}
          <button style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: SP[0.5], borderRadius: R.sm,
            border: 'none', backgroundColor: 'transparent',
            color: C.text.disabled, cursor: 'pointer',
          }}>
            <MoreHorizontal size={14} />
          </button>
        </div>
      </div>

      {/* ── Cards area ──────────────────────────────────────────────── */}
      <div
        ref={setNodeRef}
        style={{
          padding: SP[3],
          display: 'flex',
          flexDirection: 'column',
          gap: SP[2.5],
          minHeight: '200px',
        }}
      >
        <SortableContext items={stories.map(s => s.id)} strategy={verticalListSortingStrategy}>
          {stories.map(story => (
            <SortableStoryCard key={story.id} story={story} />
          ))}
        </SortableContext>

        {/* Empty state */}
        {stories.length === 0 && (
          <div style={{
            flex: 1, minHeight: '100px',
            border: `1.5px dashed ${cfg.topColor}33`,
            borderRadius: R.lg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <p style={{
              fontSize: TY.fontSize.xs, color: C.text.disabled,
              textAlign: 'center', padding: `0 ${SP[3]}`,
            }}>
              {cfg.emptyText}
            </p>
          </div>
        )}
      </div>

      {/* ── Add Story footer ─────────────────────────────────────────── */}
      <AddStoryBtn onAddStory={onAddStory} C={C} TY={TY} SP={SP} transitions={transitions} />
    </div>
  )
}

// ─── AddStoryBtn ──────────────────────────────────────────────────────────────

function AddStoryBtn({ onAddStory, C, TY, SP, transitions }: any) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onAddStory}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: SP[1.5],
        width: '100%',
        padding: `${SP[2.5]} ${SP[4]}`,
        border: 'none',
        borderTop: `1px solid ${C.border.subtle}`,
        backgroundColor: hovered ? C.card.hover : 'transparent',
        color: hovered ? C.text.primary : C.text.disabled,
        fontSize: TY.fontSize.xs,
        fontWeight: TY.fontWeight.medium,
        cursor: 'pointer',
        transition: `all ${transitions.fast}`,
        flexShrink: 0,
      }}
    >
      <Plus size={13} />
      Add Story
    </button>
  )
}
