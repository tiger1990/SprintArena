'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Sprint } from '@/types'
import { useAppStore } from '@/store/app.store'
import { useCurrentUser } from '@/hooks'
import { useTheme } from '@/hooks/useTheme'
import { sprintProgress, daysUntil } from '@/lib/utils'

export function SprintHeader({ sprint }: { sprint: Sprint }) {
  const { colors: C, typography: TY, spacing: SP, radius: R, transitions } = useTheme()
  const router = useRouter()
  const { stories } = useAppStore()
  const { isAdmin } = useCurrentUser()

  const sprintStories = stories.filter(s => s.sprintId === sprint.id)
  const done       = sprintStories.filter(s => s.status === 'done').length
  const inProgress = sprintStories.filter(s => s.status === 'in_progress').length
  const total      = sprintStories.length
  const storyPct   = total > 0 ? Math.round((done / total) * 100) : 0
  const timePct    = sprintProgress(sprint.startDate, sprint.endDate)
  const daysLeft   = daysUntil(sprint.endDate)

  const fmtShort = (d: string) =>
    new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  const daysColor = daysLeft <= 2 ? C.error : daysLeft <= 5 ? C.warning : C.text.primary

  return (
    <div style={{ padding: `0 ${SP[6]} ${SP[4]}`, flexShrink: 0 }}>
      <div style={{
        backgroundColor: C.card.DEFAULT,
        border: `1px solid ${C.border.DEFAULT}`,
        borderRadius: R['2xl'],
        overflow: 'hidden',
      }}>
        {/* ── Top: name + stats + End Sprint ─────────────────────────── */}
        <div style={{ padding: `${SP[4]} ${SP[5]}` }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: SP[4], flexWrap: 'wrap' }}>

            {/* Sprint name block */}
            <div>
              <p style={{
                fontSize: TY.fontSize['2xs'], fontWeight: TY.fontWeight.bold,
                color: C.text.disabled, letterSpacing: TY.letterSpacing.wider,
                textTransform: 'uppercase', margin: `0 0 ${SP[0.5]} 0`,
              }}>
                Sprint Name
              </p>
              <p style={{
                fontSize: TY.fontSize.base, fontWeight: TY.fontWeight.bold,
                color: C.text.primary, margin: 0,
              }}>
                {sprint.name}
              </p>
              <p style={{
                fontSize: TY.fontSize.xs, color: C.text.disabled, margin: `${SP[0.5]} 0 0 0`,
              }}>
                {fmtShort(sprint.startDate)} → {fmtShort(sprint.endDate)}
              </p>
            </div>

            {/* Stats row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 0, flexWrap: 'wrap', flex: 1, justifyContent: 'center' }}>
              <StatCell label="Stories done" value={`${done}/${total}`} color={C.text.primary}   TY={TY} SP={SP} />
              <StatDivider C={C} SP={SP} />
              <StatCell label="Days left"    value={daysLeft > 0 ? `${daysLeft}d` : 'Ended'} color={daysColor} TY={TY} SP={SP} />
              <StatDivider C={C} SP={SP} />
              <StatCell label="Active"       value={`${inProgress}`} color={C.accent.DEFAULT} TY={TY} SP={SP} />
              <StatDivider C={C} SP={SP} />
              <StatCell label="Progress"     value={`${storyPct}%`}  color={C.accent.DEFAULT} TY={TY} SP={SP} />
            </div>

            {/* End Sprint button */}
            {isAdmin && (
              <EndSprintBtn
                onClick={() => router.push(`/sprints/${sprint.id}/end`)}
                C={C} TY={TY} SP={SP} R={R} transitions={transitions}
              />
            )}
          </div>
        </div>

        {/* ── Progress bar section ────────────────────────────────────── */}
        <div style={{ borderTop: `1px solid ${C.border.subtle}`, padding: `${SP[3]} ${SP[5]}` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: SP[1.5] }}>
            <p style={{
              fontSize: TY.fontSize['2xs'], fontWeight: TY.fontWeight.bold,
              color: C.text.disabled, letterSpacing: TY.letterSpacing.wider,
              textTransform: 'uppercase', margin: 0,
            }}>
              {storyPct}% Done
            </p>
            <p style={{
              fontSize: TY.fontSize['2xs'], fontWeight: TY.fontWeight.bold,
              color: C.text.disabled, letterSpacing: TY.letterSpacing.wider,
              textTransform: 'uppercase', margin: 0,
            }}>
              {timePct}% Time Elapsed
            </p>
          </div>
          <div style={{
            height: '4px', backgroundColor: C.card.sunken,
            borderRadius: R.full, overflow: 'hidden',
          }}>
            <div style={{
              height: '100%', width: `${storyPct}%`,
              background: `linear-gradient(90deg, ${C.accent.dim}, ${C.accent.DEFAULT})`,
              borderRadius: R.full, transition: 'width 0.6s ease',
            }} />
          </div>
        </div>

        {/* ── Goal ────────────────────────────────────────────────────── */}
        {sprint.goal && (
          <div style={{
            borderTop: `1px solid ${C.border.subtle}`,
            padding: `${SP[2.5]} ${SP[5]}`,
          }}>
            <p style={{
              fontSize: TY.fontSize.xs, color: C.text.secondary,
              fontStyle: 'italic', margin: 0,
            }}>
              <span style={{ color: C.text.disabled, fontWeight: TY.fontWeight.bold, fontStyle: 'normal' }}>Goal: </span>
              {sprint.goal}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── StatCell ─────────────────────────────────────────────────────────────────

function StatCell({ label, value, color, TY, SP }: {
  label: string; value: string; color: string; TY: any; SP: any
}) {
  return (
    <div style={{ textAlign: 'center', padding: `0 ${SP[4]}` }}>
      <p className="headline-font" style={{
        fontSize: TY.fontSize.xl, fontWeight: TY.fontWeight.bold,
        color, lineHeight: 1, margin: `0 0 ${SP[0.5]} 0`,
      }}>
        {value}
      </p>
      <p style={{
        fontSize: TY.fontSize['2xs'], color: 'rgba(173,170,173,0.60)',
        fontWeight: TY.fontWeight.medium,
        letterSpacing: TY.letterSpacing.wide, margin: 0,
      }}>
        {label}
      </p>
    </div>
  )
}

function StatDivider({ C, SP }: { C: any; SP: any }) {
  return (
    <div style={{
      width: '1px', height: '32px',
      backgroundColor: C.border.DEFAULT,
      flexShrink: 0,
    }} />
  )
}

// ─── EndSprintBtn ─────────────────────────────────────────────────────────────

function EndSprintBtn({ onClick, C, TY, SP, R, transitions }: any) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: `${SP[2]} ${SP[4]}`,
        borderRadius: R.lg,
        border: `1px solid ${hovered ? C.error : `${C.error}66`}`,
        backgroundColor: hovered ? `${C.error}11` : 'transparent',
        color: C.error,
        fontSize: TY.fontSize.sm,
        fontWeight: TY.fontWeight.semibold,
        cursor: 'pointer',
        transition: `all ${transitions.fast}`,
        whiteSpace: 'nowrap',
        flexShrink: 0,
      }}
    >
      End Sprint
    </button>
  )
}
