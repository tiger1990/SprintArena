'use client'
import { useState } from 'react'
import type { Story } from '@/types'
import { useAppStore } from '@/store/app.store'
import { useTheme } from '@/hooks/useTheme'
import { canMoveStory } from '@/lib/permissions'
import { Avatar } from '@/components/shared/Avatar'
import { StoryDetailSheet } from './StoryDetailSheet'
import { ArrowRight, CheckCircle2, Lock } from 'lucide-react'

// ─── Priority config ──────────────────────────────────────────────────────────

const PRIORITY: Record<string, { label: string; color: string; bg: string }> = {
  low:      { label: 'Low',      color: '#4ade80', bg: 'rgba(74,222,128,0.12)'   },
  medium:   { label: 'Medium',   color: '#fbbf24', bg: 'rgba(251,191,36,0.12)'   },
  high:     { label: 'High',     color: '#f97316', bg: 'rgba(249,115,22,0.12)'   },
  critical: { label: 'Critical', color: '#f87171', bg: 'rgba(248,113,113,0.12)'  },
}

// ─── Quick action config ──────────────────────────────────────────────────────

const QUICK_ACTION: Record<string, { label: string; next: Story['status'] }> = {
  todo:        { label: 'Start',    next: 'in_progress' },
  in_progress: { label: 'Review',   next: 'review'      },
  review:      { label: 'Complete', next: 'done'         },
}

interface StoryCardProps {
  story: Story
  isDragging?: boolean
}

export function StoryCard({ story, isDragging }: StoryCardProps) {
  const { colors: C, typography: TY, spacing: SP, radius: R, transitions } = useTheme()
  const { currentUser, getUserById, moveStory, getActiveSprint } = useAppStore()
  const [open,    setOpen]    = useState(false)
  const [hovered, setHovered] = useState(false)

  const assignee = story.assigneeId ? getUserById(story.assigneeId) : null
  const canMove  = currentUser ? canMoveStory(currentUser, story) : false
  const sprint   = getActiveSprint()
  const isDone   = story.status === 'done'

  const metAC   = story.acceptanceCriteria.filter(ac => ac.isMet).length
  const totalAC = story.acceptanceCriteria.length
  const acPct   = totalAC > 0 ? Math.round((metAC / totalAC) * 100) : 0

  const p      = PRIORITY[story.priority] ?? PRIORITY.medium
  const action = QUICK_ACTION[story.status]

  const handleQuickAction = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!currentUser || !canMove || !action) return
    moveStory(story.id, action.next, currentUser.id)
  }

  // Card border color
  const borderColor = isDragging
    ? C.accent.DEFAULT
    : isDone
    ? '#4ade8033'
    : hovered
    ? C.border.strong
    : C.border.DEFAULT

  return (
    <>
      <div
        onClick={() => setOpen(true)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          backgroundColor: isDone ? `${C.card.DEFAULT}cc` : C.card.DEFAULT,
          border: `1px solid ${borderColor}`,
          borderRadius: R.xl,
          padding: SP[4],
          cursor: 'pointer',
          opacity: isDragging ? 0.85 : isDone ? 0.65 : 1,
          transform: isDragging ? 'rotate(2deg) scale(1.03)' : 'none',
          boxShadow: isDragging ? `0 12px 32px rgba(0,0,0,0.5)` : 'none',
          transition: `border-color ${transitions.fast}, opacity ${transitions.fast}`,
          display: 'flex',
          flexDirection: 'column',
          gap: SP[2.5],
          position: 'relative',
        }}
      >
        {/* ── Header: priority pill + points ───────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: SP[2] }}>
          <span style={{
            padding: '2px 8px', borderRadius: R.full,
            fontSize: TY.fontSize['2xs'], fontWeight: TY.fontWeight.bold,
            color: p.color, backgroundColor: p.bg,
            letterSpacing: TY.letterSpacing.wide, textTransform: 'uppercase',
          }}>
            {p.label}
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: SP[1.5] }}>
            {!canMove && !isDone && (
              <Lock size={10} color={C.text.disabled} />
            )}
            {isDone && (
              <CheckCircle2 size={12} color="#4ade80" />
            )}
            <span style={{
              fontSize: TY.fontSize['2xs'], fontWeight: TY.fontWeight.bold,
              color: C.accent.DEFAULT,
            }}>
              {story.storyPoints} pts
            </span>
          </div>
        </div>

        {/* ── Title ────────────────────────────────────────────────── */}
        <h3 style={{
          fontSize: TY.fontSize.sm,
          fontWeight: TY.fontWeight.semibold,
          color: isDone ? C.text.secondary : C.text.primary,
          lineHeight: TY.lineHeight.snug,
          margin: 0,
          textDecoration: isDone ? 'line-through' : 'none',
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
        }}>
          {story.title}
        </h3>

        {/* ── Description ──────────────────────────────────────────── */}
        {story.description && (
          <p style={{
            fontSize: TY.fontSize.xs,
            color: C.text.secondary,
            lineHeight: TY.lineHeight.relaxed,
            margin: 0,
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}>
            {story.description}
          </p>
        )}

        {/* ── AC progress bar (in_progress only) ───────────────────── */}
        {story.status === 'in_progress' && totalAC > 0 && (
          <div>
            <div style={{
              height: '3px', backgroundColor: C.card.sunken,
              borderRadius: R.full, overflow: 'hidden',
            }}>
              <div style={{
                height: '100%', width: `${acPct}%`,
                background: `linear-gradient(90deg, ${C.accent.dim}, ${C.accent.DEFAULT})`,
                borderRadius: R.full,
                transition: 'width 0.4s ease',
              }} />
            </div>
            <p style={{
              fontSize: TY.fontSize['2xs'], color: C.text.disabled,
              textAlign: 'right', marginTop: '3px',
            }}>
              {acPct}%
            </p>
          </div>
        )}

        {/* ── Footer: avatar + AC counter + quick action ───────────── */}
        <div style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', gap: SP[2],
        }}>
          {/* Avatar + AC counter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: SP[2] }}>
            {assignee ? (
              <Avatar user={assignee} size="xs" />
            ) : (
              <div style={{
                width: '20px', height: '20px', borderRadius: '9999px',
                border: `1px dashed ${C.border.DEFAULT}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ fontSize: '8px', color: C.text.disabled }}>?</span>
              </div>
            )}

            {totalAC > 0 && (
              <span style={{
                fontSize: TY.fontSize['2xs'], color: C.text.disabled,
                fontWeight: TY.fontWeight.medium,
              }}>
                {metAC}/{totalAC}
              </span>
            )}
          </div>

          {/* Quick action */}
          {canMove && !isDone && sprint && action && (
            <button
              onClick={handleQuickAction}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '3px',
                background: 'none', border: 'none', padding: '2px 0',
                fontSize: TY.fontSize['2xs'], fontWeight: TY.fontWeight.bold,
                color: C.accent.DEFAULT, cursor: 'pointer',
                transition: `color ${transitions.fast}`,
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = C.accent.fixedDim }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = C.accent.DEFAULT }}
            >
              {action.label}
              {action.next === 'done'
                ? <CheckCircle2 size={10} />
                : <ArrowRight size={10} />
              }
            </button>
          )}
        </div>
      </div>

      <StoryDetailSheet story={story} open={open} onClose={() => setOpen(false)} />
    </>
  )
}
