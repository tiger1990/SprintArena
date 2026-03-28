'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAppStore } from '@/store/app.store'
import { useTheme } from '@/hooks/useTheme'
import { useCurrentUser, useActiveSprint } from '@/hooks'
import { formatRelativeTime } from '@/lib/utils'
import { canAddToSprint, canDeleteStory } from '@/lib/permissions'
import { Avatar } from '@/components/shared/Avatar'
import { CreateStoryDialog } from '@/components/stories/CreateStoryDialog'
import { toast } from 'sonner'
import {
  Sparkles, Plus, ArrowRight, Trash2, Tag,
  Clock, ChevronDown,
} from 'lucide-react'
import type { Story, User } from '@/types'

// ─── Priority config ──────────────────────────────────────────────────────────

const PRIORITY_STYLE: Record<string, { color: string; bg: string; label: string }> = {
  low:      { color: '#4ade80', bg: 'rgba(74,222,128,0.12)',  label: 'Low Priority'      },
  medium:   { color: '#fbbf24', bg: 'rgba(251,191,36,0.12)', label: 'Medium Priority'    },
  high:     { color: '#f97316', bg: 'rgba(249,115,22,0.12)', label: 'High Priority'      },
  critical: { color: '#f87171', bg: 'rgba(248,113,113,0.12)', label: 'Critical Priority' },
}

// Derive a display status for each backlog story
function storyDisplayStatus(story: Story): { label: string; color: string; bg: string } {
  if (story.comments.some(c => c.isBlocker)) {
    return { label: 'Blocked',     color: '#f87171', bg: 'rgba(248,113,113,0.12)' }
  }
  if (story.comments.length > 0) {
    return { label: 'Refinement',  color: '#fbbf24', bg: 'rgba(251,191,36,0.12)' }
  }
  if (story.status === 'proposed') {
    return { label: 'Proposed',    color: '#94a3b8', bg: 'rgba(148,163,184,0.10)' }
  }
  return { label: 'Ready',         color: '#4ade80', bg: 'rgba(74,222,128,0.12)' }
}

// Generate short story ID: SA-XXXX based on orderIndex
function storyId(story: Story) {
  return `SA-${String(story.orderIndex + 1).padStart(4, '0')}`
}

type FilterKey = 'all' | 'ready' | 'refinement' | 'blocked'

const COLLAPSED_COUNT = 8

export default function BacklogPage() {
  const { colors: C, typography: TY, spacing: SP, radius: R, transitions } = useTheme()
  const router = useRouter()
  const { getBacklogStories, getUserById, deleteStory, addToSprint } = useAppStore()
  const { user: currentUser, isAdmin } = useCurrentUser()
  const { sprint: activeSprint } = useActiveSprint()

  const [filter,     setFilter]     = useState<FilterKey>('all')
  const [createOpen, setCreateOpen] = useState(false)
  const [expanded,   setExpanded]   = useState(false)

  const allStories = getBacklogStories()

  // ── Stats ──────────────────────────────────────────────────────────────────
  const totalPts       = allStories.reduce((s, st) => s + st.storyPoints, 0)
  const readyStories   = allStories.filter(s => !s.comments.some(c => c.isBlocker) && s.comments.length === 0)
  const refinement     = allStories.filter(s => s.comments.length > 0 && !s.comments.some(c => c.isBlocker))
  const blocked        = allStories.filter(s => s.comments.some(c => c.isBlocker))
  const criticalCount  = allStories.filter(s => s.priority === 'critical').length
  const priorityHealth = allStories.length > 0
    ? Math.round(((allStories.length - criticalCount) / allStories.length) * 100) : 100

  // ── Filter ─────────────────────────────────────────────────────────────────
  const filtered = allStories.filter(s => {
    if (filter === 'ready')       return !s.comments.some(c => c.isBlocker) && s.comments.length === 0
    if (filter === 'refinement')  return s.comments.length > 0 && !s.comments.some(c => c.isBlocker)
    if (filter === 'blocked')     return s.comments.some(c => c.isBlocker)
    return true
  })

  const visible = expanded ? filtered : filtered.slice(0, COLLAPSED_COUNT)
  const hasMore = filtered.length > COLLAPSED_COUNT

  const FILTERS: { key: FilterKey; label: string; count: number }[] = [
    { key: 'all',        label: 'All Stories',   count: allStories.length  },
    { key: 'ready',      label: 'Ready',          count: readyStories.length },
    { key: 'refinement', label: 'In Refinement',  count: refinement.length  },
    { key: 'blocked',    label: 'Blocked',         count: blocked.length     },
  ]

  return (
    <>
      <div style={{ padding: SP[6], display: 'flex', flexDirection: 'column', gap: SP[5] }}>

        {/* ── Page header ──────────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: SP[4], flexWrap: 'wrap' }}>
          <div>
            <h1
              className="headline-font"
              style={{
                fontSize: TY.fontSize['4xl'], fontWeight: TY.fontWeight.bold,
                color: C.text.primary, letterSpacing: TY.letterSpacing.tight,
                lineHeight: TY.lineHeight.tight, margin: 0,
              }}
            >
              Backlog
            </h1>
            <p style={{
              fontSize: TY.fontSize.sm, color: C.text.secondary,
              lineHeight: TY.lineHeight.relaxed, marginTop: SP[1],
              maxWidth: '480px',
            }}>
              Prioritize your product roadmap and manage upcoming tasks in the digital velodrome.
            </p>
          </div>

          <div style={{ display: 'flex', gap: SP[2.5], alignItems: 'center', flexShrink: 0 }}>
            <HeaderBtn
              outline
              onClick={() => router.push('/ai-generator')}
              C={C} TY={TY} SP={SP} R={R} transitions={transitions}
            >
              <Sparkles size={14} style={{ marginRight: SP[1.5] }} />
              AI Refinement
            </HeaderBtn>
            <HeaderBtn
              onClick={() => setCreateOpen(true)}
              C={C} TY={TY} SP={SP} R={R} transitions={transitions}
            >
              <Plus size={14} style={{ marginRight: SP[1.5] }} />
              Add Story
            </HeaderBtn>
          </div>
        </div>

        {/* ── Stat cards ───────────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: SP[3] }}
             className="grid-cols-2 sm:grid-cols-4">
          <StatCard
            label="Total Stories"
            value={allStories.length}
            sub={`+${Math.min(4, allStories.length)} from last sprint`}
            subColor={C.success}
            accent={C.accent.DEFAULT}
            C={C} TY={TY} SP={SP} R={R}
          />
          <StatCard
            label="Estimated Points"
            value={totalPts}
            underlineColor={C.accent.DEFAULT}
            C={C} TY={TY} SP={SP} R={R}
          />
          <StatCard
            label="Ready for Sprint"
            value={readyStories.length}
            sub={`Requires refinement: ${refinement.length}`}
            subColor={C.error}
            C={C} TY={TY} SP={SP} R={R}
          />
          <StatCard
            label="Priority Health"
            value={`${priorityHealth}%`}
            dots={[
              { color: '#4ade80', count: readyStories.length > 0 ? 1 : 0 },
              { color: '#fbbf24', count: refinement.length > 0 ? 1 : 0 },
              { color: '#f87171', count: blocked.length > 0 ? 1 : 0 },
            ]}
            C={C} TY={TY} SP={SP} R={R}
          />
        </div>

        {/* ── Filter tabs + count ──────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: SP[3], flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: SP[1.5], flexWrap: 'wrap' }}>
            {FILTERS.map(f => (
              <FilterChip
                key={f.key}
                label={f.label}
                active={filter === f.key}
                onClick={() => { setFilter(f.key); setExpanded(false) }}
                C={C} TY={TY} SP={SP} R={R} transitions={transitions}
              />
            ))}
          </div>
          <p style={{
            fontSize: TY.fontSize.xs, color: C.text.secondary,
            fontWeight: TY.fontWeight.medium, margin: 0, flexShrink: 0,
          }}>
            Showing {filtered.length} {filtered.length === 1 ? 'story' : 'stories'}
          </p>
        </div>

        {/* ── Story list ───────────────────────────────────────────────── */}
        {filtered.length === 0 ? (
          <EmptyBacklog filter={filter} C={C} TY={TY} SP={SP} R={R} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: SP[2] }}>
            {visible.map((story, idx) => {
              const assigneeIds = story.assigneeId ? [story.assigneeId] : []
              const assignees   = assigneeIds.map(id => getUserById(id)).filter(Boolean) as User[]
              const canDel      = currentUser ? canDeleteStory(currentUser, story) : false
              const canAdd      = currentUser && activeSprint ? canAddToSprint(currentUser) : false
              const status      = storyDisplayStatus(story)
              const pStyle      = PRIORITY_STYLE[story.priority]

              return (
                <StoryRow
                  key={story.id}
                  story={story}
                  sid={storyId(story)}
                  assignees={assignees}
                  status={status}
                  pStyle={pStyle}
                  canDel={canDel}
                  canAdd={!!canAdd}
                  onAddToSprint={() => { addToSprint(story.id, activeSprint!.id); toast.success('Added to sprint!') }}
                  onDelete={() => { deleteStory(story.id); toast.success('Story deleted') }}
                  C={C} TY={TY} SP={SP} R={R} transitions={transitions}
                />
              )
            })}

            {/* View all / collapse */}
            {hasMore && (
              <button
                onClick={() => setExpanded(e => !e)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  gap: SP[1.5], width: '100%',
                  padding: `${SP[3]} 0`,
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: TY.fontSize.sm, color: C.text.secondary,
                  fontWeight: TY.fontWeight.medium,
                  transition: `color ${transitions.fast}`,
                }}
                onMouseEnter={e => { e.currentTarget.style.color = C.text.primary }}
                onMouseLeave={e => { e.currentTarget.style.color = C.text.secondary }}
              >
                {expanded
                  ? 'Show fewer stories'
                  : `View all ${filtered.length} stories`}
                <ChevronDown
                  size={14}
                  style={{
                    transform: expanded ? 'rotate(180deg)' : 'none',
                    transition: `transform ${transitions.fast}`,
                  }}
                />
              </button>
            )}
          </div>
        )}
      </div>

      <CreateStoryDialog open={createOpen} onClose={() => setCreateOpen(false)} />
    </>
  )
}

// ─── StoryRow ─────────────────────────────────────────────────────────────────

function StoryRow({
  story, sid, assignees, status, pStyle,
  canDel, canAdd, onAddToSprint, onDelete,
  C, TY, SP, R, transitions,
}: {
  story: Story
  sid: string
  assignees: User[]
  status: { label: string; color: string; bg: string }
  pStyle: { color: string; bg: string; label: string }
  canDel: boolean; canAdd: boolean
  onAddToSprint: () => void; onDelete: () => void
  C: any; TY: any; SP: any; R: any; transitions: any
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: SP[4],
        backgroundColor: C.card.DEFAULT,
        border: `1px solid ${hovered ? C.border.strong : C.border.DEFAULT}`,
        borderRadius: R.xl,
        padding: `${SP[4]} ${SP[5]}`,
        transition: `border-color ${transitions.fast}`,
      }}
    >
      {/* ── Story ID + comment count ─────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: SP[1], flexShrink: 0 }}>
        <span style={{
          fontSize: TY.fontSize['2xs'], fontWeight: TY.fontWeight.bold,
          color: C.text.disabled, letterSpacing: TY.letterSpacing.wide,
          fontFamily: TY.fontFamily.mono,
        }}>
          {sid}
        </span>
        <span style={{
          fontSize: TY.fontSize['2xs'], fontWeight: TY.fontWeight.bold,
          color: C.text.disabled,
          width: '18px', height: '18px',
          borderRadius: '9999px',
          border: `1px solid ${C.border.DEFAULT}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {story.comments.length}
        </span>
      </div>

      {/* ── Title + badges ───────────────────────────────────────────── */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <h3 style={{
          fontSize: TY.fontSize.sm, fontWeight: TY.fontWeight.semibold,
          color: C.text.primary, margin: '0 0 6px 0',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {story.title}
        </h3>

        <div style={{ display: 'flex', alignItems: 'center', gap: SP[2], flexWrap: 'wrap' }}>
          {/* Priority */}
          <span style={{
            padding: '2px 8px', borderRadius: R.full,
            fontSize: TY.fontSize['2xs'], fontWeight: TY.fontWeight.bold,
            color: pStyle.color, backgroundColor: pStyle.bg,
            letterSpacing: TY.letterSpacing.wide, textTransform: 'uppercase',
          }}>
            {pStyle.label}
          </span>

          {/* Tags */}
          {story.tags.slice(0, 2).map(tag => (
            <span key={tag} style={{
              display: 'inline-flex', alignItems: 'center', gap: '3px',
              padding: '2px 7px', borderRadius: R.sm,
              fontSize: TY.fontSize['2xs'],
              color: C.text.secondary,
              backgroundColor: C.card.sunken,
              border: `1px solid ${C.border.subtle}`,
            }}>
              <Tag size={9} color={C.text.disabled} />
              {tag}
            </span>
          ))}

          {/* Created time */}
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '3px',
            fontSize: TY.fontSize['2xs'], color: C.text.disabled,
          }}>
            <Clock size={9} color={C.text.disabled} />
            Created {formatRelativeTime(story.createdAt)}
          </span>
        </div>
      </div>

      {/* ── Estimate ─────────────────────────────────────────────────── */}
      <div style={{ flexShrink: 0, textAlign: 'right' }}>
        <p style={{
          fontSize: TY.fontSize['2xs'], fontWeight: TY.fontWeight.bold,
          color: C.text.disabled, letterSpacing: TY.letterSpacing.wider,
          textTransform: 'uppercase', margin: '0 0 2px 0',
        }}>
          Estimate
        </p>
        <p
          className="headline-font"
          style={{
            fontSize: TY.fontSize.lg, fontWeight: TY.fontWeight.bold,
            color: C.text.primary, margin: 0,
          }}
        >
          {story.storyPoints} pts
        </p>
      </div>

      {/* ── Assignee avatars ─────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
        {assignees.slice(0, 3).map((user, i) => (
          <div key={user.id} style={{ marginLeft: i > 0 ? '-6px' : 0, zIndex: 3 - i, position: 'relative' }}>
            <Avatar user={user} size="xs" />
          </div>
        ))}
        {assignees.length === 0 && (
          <div style={{
            width: '20px', height: '20px', borderRadius: '9999px',
            border: `1px dashed ${C.border.DEFAULT}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: '8px', color: C.text.disabled }}>—</span>
          </div>
        )}
      </div>

      {/* ── Status chip + actions ─────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: SP[2], flexShrink: 0 }}>
        <span style={{
          padding: '3px 10px', borderRadius: R.full,
          fontSize: TY.fontSize['2xs'], fontWeight: TY.fontWeight.bold,
          color: status.color, backgroundColor: status.bg,
          letterSpacing: TY.letterSpacing.wide, textTransform: 'uppercase',
          whiteSpace: 'nowrap',
        }}>
          {status.label}
        </span>

        {canAdd && (
          <button
            onClick={onAddToSprint}
            title="Add to sprint"
            style={{
              display: 'flex', alignItems: 'center',
              padding: '4px 8px', borderRadius: R.md,
              border: `1px solid ${C.accent.DEFAULT}55`,
              backgroundColor: C.accent.bgSubtle,
              color: C.accent.DEFAULT,
              fontSize: TY.fontSize['2xs'], fontWeight: TY.fontWeight.bold,
              cursor: 'pointer', gap: '4px',
              transition: `all ${transitions.fast}`,
            }}
          >
            <ArrowRight size={11} />
            Sprint
          </button>
        )}

        {canDel && (
          <button
            onClick={onDelete}
            title="Delete story"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '4px', borderRadius: R.sm,
              background: 'none', border: 'none',
              color: C.text.disabled, cursor: 'pointer',
              transition: `color ${transitions.fast}`,
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = C.error }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = C.text.disabled }}
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>
    </div>
  )
}

// ─── StatCard ─────────────────────────────────────────────────────────────────

function StatCard({
  label, value, sub, subColor, underlineColor, accent, dots, C, TY, SP, R,
}: {
  label: string
  value: string | number
  sub?: string
  subColor?: string
  underlineColor?: string
  accent?: string
  dots?: { color: string; count: number }[]
  C: any; TY: any; SP: any; R: any
}) {
  return (
    <div style={{
      backgroundColor: C.card.DEFAULT,
      border: `1px solid ${C.border.DEFAULT}`,
      borderRadius: R.xl,
      padding: SP[4],
    }}>
      <p style={{
        fontSize: TY.fontSize.xs, color: C.text.secondary,
        fontWeight: TY.fontWeight.medium, margin: `0 0 ${SP[2]} 0`,
      }}>
        {label}
      </p>

      <p
        className="headline-font"
        style={{
          fontSize: TY.fontSize['3xl'], fontWeight: TY.fontWeight.bold,
          color: accent ?? C.text.primary, margin: 0, lineHeight: 1,
        }}
      >
        {value}
      </p>

      {/* Underline accent bar */}
      {underlineColor && (
        <div style={{
          height: '2px', width: '40px', borderRadius: R.full,
          backgroundColor: underlineColor, marginTop: SP[2],
        }} />
      )}

      {/* Sub text */}
      {sub && (
        <p style={{
          fontSize: TY.fontSize['2xs'], color: subColor ?? C.text.disabled,
          marginTop: SP[1.5], fontWeight: TY.fontWeight.medium,
        }}>
          {sub}
        </p>
      )}

      {/* Health dots */}
      {dots && (
        <div style={{ display: 'flex', gap: SP[1], marginTop: SP[2] }}>
          {dots.filter(d => d.count > 0).map((d, i) => (
            <div key={i} style={{
              width: '10px', height: '10px', borderRadius: '9999px',
              backgroundColor: d.color,
            }} />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── FilterChip ───────────────────────────────────────────────────────────────

function FilterChip({
  label, active, onClick, C, TY, SP, R, transitions,
}: {
  label: string; active: boolean; onClick: () => void
  C: any; TY: any; SP: any; R: any; transitions: any
}) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: `${SP[1.5]} ${SP[3]}`,
        borderRadius: R.full,
        border: `1px solid ${active ? C.accent.DEFAULT : C.border.DEFAULT}`,
        backgroundColor: active ? C.accent.DEFAULT : hovered ? C.card.hover : 'transparent',
        color: active ? C.accent.on : hovered ? C.text.primary : C.text.secondary,
        fontSize: TY.fontSize.xs, fontWeight: TY.fontWeight.semibold,
        cursor: 'pointer',
        transition: `all ${transitions.fast}`,
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </button>
  )
}

// ─── HeaderBtn ────────────────────────────────────────────────────────────────

function HeaderBtn({
  children, onClick, outline, C, TY, SP, R, transitions,
}: {
  children: React.ReactNode; onClick: () => void; outline?: boolean
  C: any; TY: any; SP: any; R: any; transitions: any
}) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'inline-flex', alignItems: 'center',
        padding: `${SP[2]} ${SP[4]}`,
        borderRadius: R.lg,
        border: outline ? `1px solid ${C.border.DEFAULT}` : 'none',
        backgroundColor: outline
          ? hovered ? C.card.hover : 'transparent'
          : hovered ? C.accent.fixedDim : C.accent.DEFAULT,
        color: outline ? C.text.secondary : C.accent.on,
        fontSize: TY.fontSize.sm, fontWeight: TY.fontWeight.semibold,
        cursor: 'pointer',
        transition: `all ${transitions.fast}`,
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </button>
  )
}

// ─── EmptyBacklog ─────────────────────────────────────────────────────────────

function EmptyBacklog({ filter, C, TY, SP, R }: { filter: FilterKey; C: any; TY: any; SP: any; R: any }) {
  const messages: Record<FilterKey, { icon: string; title: string; sub: string }> = {
    all:        { icon: '📋', title: 'Backlog is empty',           sub: 'Generate stories with AI or add them manually.' },
    ready:      { icon: '✅', title: 'No ready stories',            sub: 'Stories with no comments or blockers will appear here.' },
    refinement: { icon: '🔍', title: 'Nothing in refinement',      sub: 'Stories under discussion will appear here.' },
    blocked:    { icon: '🚫', title: 'No blocked stories',          sub: 'Stories with blocker comments will appear here.' },
  }
  const m = messages[filter]
  return (
    <div style={{
      textAlign: 'center', padding: `${SP[16]} ${SP[8]}`,
      backgroundColor: C.card.DEFAULT,
      border: `1px solid ${C.border.subtle}`,
      borderRadius: R.xl,
    }}>
      <p style={{ fontSize: '2.5rem', marginBottom: SP[3] }}>{m.icon}</p>
      <p style={{ fontSize: TY.fontSize.base, fontWeight: TY.fontWeight.semibold, color: C.text.primary, margin: 0 }}>{m.title}</p>
      <p style={{ fontSize: TY.fontSize.sm, color: C.text.secondary, marginTop: SP[1] }}>{m.sub}</p>
    </div>
  )
}
