'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAppStore } from '@/store/app.store'
import { useTheme } from '@/hooks/useTheme'
import { useCurrentUser } from '@/hooks'
import { daysUntil, sprintProgress } from '@/lib/utils'
import { Avatar } from '@/components/shared/Avatar'
import {
  Kanban, List, Zap, Flame, AlertTriangle, TrendingUp, TrendingDown,
} from 'lucide-react'
import type { Sprint } from '@/types'

export function ActiveSprintView({ sprint }: { sprint: Sprint }) {
  const { colors: C, typography: TY, spacing: SP, radius: R, transitions } = useTheme()
  const router = useRouter()
  const { stories, getUserById } = useAppStore()
  const { isAdmin } = useCurrentUser()

  // ── Derived metrics ──────────────────────────────────────────────────────────

  const sprintStories = stories.filter(s => s.sprintId === sprint.id)
  const doneStories   = sprintStories.filter(s => s.status === 'done')
  const blockedCount  = sprintStories.filter(s => s.comments.some(c => c.isBlocker)).length

  const totalPts      = sprintStories.reduce((sum, s) => sum + s.storyPoints, 0)
  const donePts       = doneStories.reduce((sum, s) => sum + s.storyPoints, 0)

  const daysLeft      = Math.max(0, daysUntil(sprint.endDate))
  const timeProgress  = sprintProgress(sprint.startDate, sprint.endDate)
  const storyPct      = sprintStories.length > 0
    ? Math.round((doneStories.length / sprintStories.length) * 100) : 0
  const efficiencyPct = totalPts > 0 ? Math.round((donePts / totalPts) * 100) : 0
  // Velocity index: how far ahead/behind completion is relative to time elapsed
  const velocityIdx   = timeProgress > 0
    ? Math.min(200, Math.round((storyPct / timeProgress) * 100)) : 0

  const isOnTrack     = storyPct >= timeProgress

  // Unique assignee avatars
  const assigneeIds = [...new Set(
    sprintStories.filter(s => s.assigneeId).map(s => s.assigneeId!)
  )]
  const assignees = assigneeIds.slice(0, 5)
    .map(id => getUserById(id))
    .filter(Boolean) as NonNullable<ReturnType<typeof getUserById>>[]

  // Timeline phase derived from time progress
  const currentPhase    = timeProgress < 33 ? 'Planning Phase'
    : timeProgress < 66 ? 'Deep Focus Sprint' : 'Final Push'
  const nextMilestone   = timeProgress < 33 ? 'Mid-Sprint Review'
    : timeProgress < 66 ? 'Beta Review' : 'Deployment'

  // Sprint start/end for timeline label
  const fmtShort = (d: string) =>
    new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: SP[4] }}>

      {/* ── Sprint hero ─────────────────────────────────────────────────── */}
      <div
        style={{
          backgroundColor: C.card.DEFAULT,
          border: `1px solid ${C.border.DEFAULT}`,
          borderRadius: R['2xl'],
          padding: SP[6],
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background glow */}
        <div style={{
          position: 'absolute', top: '-60px', left: '25%',
          width: '320px', height: '320px',
          borderRadius: '9999px', backgroundColor: C.accent.bgSubtle,
          filter: 'blur(80px)', pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Status badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: SP[2], marginBottom: SP[3] }}>
            <Badge color={C.error} label="Live Arena" />
            <Badge color={isOnTrack ? C.success : C.warning} label={isOnTrack ? '• On Track' : '• Behind'} />
          </div>

          {/* Sprint name + right-side stats */}
          <div style={{
            display: 'flex', alignItems: 'flex-start',
            justifyContent: 'space-between', gap: SP[5], flexWrap: 'wrap',
          }}>
            {/* Left: name + goal */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2
                className="headline-font"
                style={{
                  fontSize: TY.fontSize['5xl'],
                  fontWeight: TY.fontWeight.bold,
                  color: C.text.primary,
                  letterSpacing: TY.letterSpacing.tighter,
                  lineHeight: TY.lineHeight.tight,
                  margin: 0,
                }}
              >
                {sprint.name}
              </h2>
              {sprint.goal && (
                <p style={{
                  fontSize: TY.fontSize.sm,
                  color: C.text.secondary,
                  lineHeight: TY.lineHeight.relaxed,
                  marginTop: SP[2],
                  maxWidth: '520px',
                }}>
                  {sprint.goal}
                </p>
              )}
            </div>

            {/* Right: counters + avatars */}
            <div style={{
              display: 'flex', flexDirection: 'column',
              alignItems: 'flex-end', gap: SP[3], flexShrink: 0,
            }}>
              <div style={{ display: 'flex', gap: SP[5] }}>
                <StatCounter value={daysLeft}           label="Days Left"   color={C.text.primary}   TY={TY} SP={SP} />
                <StatCounter value={doneStories.length} label="Tasks Done"  color={C.accent.DEFAULT} TY={TY} SP={SP} />
              </div>

              {/* Avatar stack */}
              {assignees.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  {assignees.map((user, i) => (
                    <div
                      key={user.id}
                      style={{
                        marginLeft: i > 0 ? '-8px' : 0,
                        zIndex: assignees.length - i,
                        position: 'relative',
                      }}
                    >
                      <Avatar user={user} size="xs" />
                    </div>
                  ))}
                  {assigneeIds.length > 5 && (
                    <div style={{
                      marginLeft: '-8px',
                      width: '20px', height: '20px',
                      borderRadius: '9999px',
                      backgroundColor: C.card.hover,
                      border: `2px solid ${C.card.DEFAULT}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: TY.fontSize['2xs'],
                      fontWeight: TY.fontWeight.bold,
                      color: C.text.secondary,
                      position: 'relative', zIndex: 0,
                    }}>
                      +{assigneeIds.length - 5}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Stories Completed ───────────────────────────────────────────── */}
      <div style={{
        backgroundColor: C.card.DEFAULT,
        border: `1px solid ${C.border.DEFAULT}`,
        borderRadius: R.xl,
        padding: SP[5],
      }}>
        <div style={{
          display: 'flex', alignItems: 'flex-start',
          justifyContent: 'space-between', marginBottom: SP[4],
        }}>
          <div>
            <p style={{
              fontSize: TY.fontSize.base, fontWeight: TY.fontWeight.bold,
              color: C.text.primary, margin: 0,
            }}>
              Stories Completed
            </p>
            <p style={{
              fontSize: TY.fontSize.xs, color: C.text.secondary,
              marginTop: SP[0.5], margin: `${SP[0.5]} 0 0 0`,
            }}>
              Target: {sprintStories.length} Stories
            </p>
          </div>
          <p
            className="headline-font"
            style={{
              fontSize: TY.fontSize['4xl'], fontWeight: TY.fontWeight.bold,
              color: C.accent.DEFAULT, lineHeight: 1, margin: 0,
            }}
          >
            {storyPct}%
          </p>
        </div>

        {/* Progress bar */}
        <div style={{
          height: '8px',
          backgroundColor: C.card.sunken,
          borderRadius: R.full,
          overflow: 'hidden',
          marginBottom: SP[3],
        }}>
          <div style={{
            height: '100%',
            width: `${storyPct}%`,
            background: `linear-gradient(90deg, ${C.accent.dim}, ${C.accent.DEFAULT})`,
            borderRadius: R.full,
            transition: 'width 0.6s ease',
          }} />
        </div>

        {/* Milestone labels */}
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          {['Sprint Start', 'Milestone 2', 'Deployment'].map(label => (
            <p
              key={label}
              style={{
                fontSize: TY.fontSize['2xs'],
                fontWeight: TY.fontWeight.bold,
                color: C.text.disabled,
                letterSpacing: TY.letterSpacing.wide,
                textTransform: 'uppercase',
                margin: 0,
              }}
            >
              {label}
            </p>
          ))}
        </div>
      </div>

      {/* ── Mini stat cards ─────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: SP[3] }}>
        <MiniStat
          icon={Flame}
          label="Velocity Index"
          value={`${velocityIdx}%`}
          positive={velocityIdx >= 100}
          C={C} TY={TY} SP={SP} R={R}
        />
        <MiniStat
          icon={AlertTriangle}
          label="Blocked Items"
          value={`${blockedCount}`}
          positive={blockedCount === 0}
          C={C} TY={TY} SP={SP} R={R}
        />
        <MiniStat
          icon={Zap}
          label="Efficiency"
          value={`${efficiencyPct}%`}
          positive={efficiencyPct >= 70}
          C={C} TY={TY} SP={SP} R={R}
        />
      </div>

      {/* ── Sprint Timeline ──────────────────────────────────────────────── */}
      <div style={{
        backgroundColor: C.card.DEFAULT,
        border: `1px solid ${C.border.DEFAULT}`,
        borderRadius: R.xl,
        padding: SP[5],
      }}>
        <div style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', marginBottom: SP[3],
        }}>
          <p style={{
            fontSize: TY.fontSize['2xs'], fontWeight: TY.fontWeight.bold,
            color: C.text.disabled, letterSpacing: TY.letterSpacing.wide,
            textTransform: 'uppercase', margin: 0,
          }}>
            Sprint Timeline
          </p>
          <p style={{ fontSize: TY.fontSize.xs, color: C.text.secondary, margin: 0 }}>
            {fmtShort(sprint.startDate)} — {fmtShort(sprint.endDate)}
          </p>
        </div>

        {/* Timeline bar */}
        <div style={{
          height: '4px', backgroundColor: C.card.sunken,
          borderRadius: R.full, overflow: 'hidden', marginBottom: SP[3],
        }}>
          <div style={{
            height: '100%', width: `${timeProgress}%`,
            background: `linear-gradient(90deg, ${C.accent.dim}, ${C.accent.DEFAULT})`,
            borderRadius: R.full,
          }} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <p style={{
              fontSize: TY.fontSize['2xs'], fontWeight: TY.fontWeight.bold,
              color: C.text.disabled, letterSpacing: TY.letterSpacing.wide,
              textTransform: 'uppercase', margin: 0,
            }}>
              Current Phase
            </p>
            <p style={{
              fontSize: TY.fontSize.sm, fontWeight: TY.fontWeight.semibold,
              color: C.text.primary, marginTop: SP[0.5],
            }}>
              {currentPhase}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{
              fontSize: TY.fontSize['2xs'], fontWeight: TY.fontWeight.bold,
              color: C.text.disabled, letterSpacing: TY.letterSpacing.wide,
              textTransform: 'uppercase', margin: 0,
            }}>
              Next Milestone
            </p>
            <p style={{
              fontSize: TY.fontSize.sm, fontWeight: TY.fontWeight.semibold,
              color: C.text.primary, marginTop: SP[0.5],
            }}>
              {nextMilestone}
            </p>
          </div>
        </div>
      </div>

      {/* ── Action buttons ───────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: SP[3], flexWrap: 'wrap' }}>
        <ActionBtn outline onClick={() => router.push('/board')} C={C} TY={TY} SP={SP} R={R} transitions={transitions}>
          <Kanban size={14} style={{ marginRight: SP[1.5] }} />
          View Kanban
        </ActionBtn>
        <ActionBtn outline onClick={() => router.push('/backlog')} C={C} TY={TY} SP={SP} R={R} transitions={transitions}>
          <List size={14} style={{ marginRight: SP[1.5] }} />
          Manage Backlog
        </ActionBtn>
        {isAdmin && (
          <ActionBtn onClick={() => router.push(`/sprints/${sprint.id}/end`)} C={C} TY={TY} SP={SP} R={R} transitions={transitions}>
            <Zap size={14} style={{ marginRight: SP[1.5] }} />
            Complete Sprint
          </ActionBtn>
        )}
      </div>
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Badge({ color, label }: { color: string; label: string }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '2px 10px',
      borderRadius: '9999px',
      border: `1px solid ${color}55`,
      backgroundColor: `${color}11`,
      fontSize: '10px', fontWeight: 700,
      color, letterSpacing: '0.1em', textTransform: 'uppercase',
    }}>
      {label}
    </span>
  )
}

function StatCounter({
  value, label, color, TY, SP,
}: {
  value: number; label: string; color: string; TY: any; SP: any
}) {
  return (
    <div style={{ textAlign: 'right' }}>
      <p
        className="headline-font"
        style={{
          fontSize: TY.fontSize['4xl'], fontWeight: TY.fontWeight.bold,
          color, lineHeight: 1, margin: 0,
        }}
      >
        {value}
      </p>
      <p style={{
        fontSize: TY.fontSize['2xs'], fontWeight: TY.fontWeight.bold,
        color: 'rgba(173,170,173,0.70)',
        letterSpacing: '0.1em', textTransform: 'uppercase',
        marginTop: '4px',
      }}>
        {label}
      </p>
    </div>
  )
}

function MiniStat({
  icon: Icon, label, value, positive, C, TY, SP, R,
}: {
  icon: any; label: string; value: string; positive: boolean
  C: any; TY: any; SP: any; R: any
}) {
  const trendColor = positive ? C.success : C.error
  const TrendIcon  = positive ? TrendingUp : TrendingDown

  return (
    <div style={{
      backgroundColor: C.card.DEFAULT,
      border: `1px solid ${C.border.DEFAULT}`,
      borderRadius: R.xl, padding: SP[4],
      display: 'flex', flexDirection: 'column', gap: SP[2],
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{
          width: SP[7], height: SP[7], borderRadius: R.md,
          backgroundColor: C.accent.bgSubtle,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={14} color={C.accent.DEFAULT} />
        </div>
        <TrendIcon size={12} color={trendColor} />
      </div>
      <div>
        <p style={{
          fontSize: TY.fontSize['2xs'], fontWeight: TY.fontWeight.bold,
          color: C.text.disabled, letterSpacing: TY.letterSpacing.wide,
          textTransform: 'uppercase', margin: 0,
        }}>
          {label}
        </p>
        <p
          className="headline-font"
          style={{
            fontSize: TY.fontSize['2xl'], fontWeight: TY.fontWeight.bold,
            color: C.text.primary, lineHeight: TY.lineHeight.tight, margin: 0,
          }}
        >
          {value}
        </p>
      </div>
    </div>
  )
}

function ActionBtn({
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
        padding: `${SP[2.5]} ${SP[4]}`,
        borderRadius: R.lg,
        border: outline ? `1px solid ${C.border.DEFAULT}` : 'none',
        backgroundColor: outline
          ? hovered ? C.card.hover : 'transparent'
          : hovered ? C.accent.fixedDim : C.accent.DEFAULT,
        color: outline ? C.text.secondary : C.accent.on,
        fontSize: TY.fontSize.sm,
        fontWeight: TY.fontWeight.semibold,
        cursor: 'pointer',
        transition: `all ${transitions.fast}`,
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </button>
  )
}
