'use client'
import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAppStore } from '@/store/app.store'
import { useTheme } from '@/hooks/useTheme'
import { useCurrentUser } from '@/hooks'
import { Flag, Rocket, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { STATUS_LABELS } from '@/types'

const STEPS = [
  {
    title: 'All stories are locked — no more moves',
    desc: 'Active tasks will be automatically moved to the backlog or current state frozen.',
  },
  {
    title: 'Sprint scores are calculated for all team members',
    desc: 'Velocity and individual contribution metrics will be processed.',
  },
  {
    title: 'Badges are awarded based on performance',
    desc: '"The Closer", "Bug Squasher", and "Code Samurai" titles will be distributed.',
  },
  {
    title: 'Sprint MVP is announced to the whole team',
    desc: 'The top-performing squad member will be featured on the arena leaderboard.',
  },
]

export default function EndSprintPage() {
  const { colors: C, typography: TY, spacing: SP, radius: R, transitions } = useTheme()
  const params  = useParams()
  const router  = useRouter()
  const { sprints, stories, sprintResults, endSprint, getUserById } = useAppStore()
  const { isAdmin, isHydrated } = useCurrentUser()

  const sprint = sprints.find(s => s.id === params.id)
  const [spillDecisions, setSpillDecisions] = useState<Record<string, 'spill' | 'backlog'>>({})
  const [isEnding, setIsEnding] = useState(false)

  if (!isHydrated) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '256px', backgroundColor: C.page,
      }}>
        <div className="animate-spin" style={{
          width: '28px', height: '28px',
          border: `2px solid ${C.accent.DEFAULT}`,
          borderTopColor: 'transparent', borderRadius: '9999px',
        }} />
      </div>
    )
  }

  if (!sprint || !isAdmin) {
    return (
      <div style={{ padding: SP[6], color: C.text.secondary, fontSize: TY.fontSize.sm, backgroundColor: C.page }}>
        Not found or insufficient permissions.
      </div>
    )
  }

  const sprintStories     = stories.filter(s => s.sprintId === sprint.id)
  const doneStories       = sprintStories.filter(s => s.status === 'done')
  const incompleteStories = sprintStories.filter(s => s.status !== 'done' && s.status !== 'spilled')

  const prevResult = [...sprintResults]
    .filter(r => {
      const sp = sprints.find(s => s.id === r.sprintId)
      return sp && sp.status === 'completed' && sp.id !== sprint.id
    })
    .sort((a, b) =>
      new Date(sprints.find(s => s.id === b.sprintId)?.createdAt ?? 0).getTime() -
      new Date(sprints.find(s => s.id === a.sprintId)?.createdAt ?? 0).getTime()
    )[0]

  const currentVelocity = doneStories.reduce((sum, s) => sum + s.storyPoints, 0)
  const prevVelocity    = prevResult?.rawStoryPoints ?? 0
  const velocityDelta   = prevVelocity > 0
    ? Math.round(((currentVelocity - prevVelocity) / prevVelocity) * 100)
    : null
  const velocityUp = velocityDelta !== null && velocityDelta >= 0

  const handleEnd = () => {
    if (isEnding) return
    setIsEnding(true)
    const spilledIds = Object.entries(spillDecisions)
      .filter(([, d]) => d === 'spill')
      .map(([id]) => id)
    endSprint(sprint.id, spilledIds)
    toast.success('Sprint ended! Calculating results…')
    router.push(`/sprints/${sprint.id}/winner`)
  }

  return (
    /*
     * Page shell:
     *  - backgroundColor: C.page ensures the exact dark surface (#0e0e10)
     *    is pinned regardless of what the AppShell parent inherits.
     *  - position: relative is ONLY on this outer shell so that the
     *    CYCLE SUMMARY card can anchor to the page's top-right corner,
     *    completely outside the centered content column.
     *  - minHeight: 100% fills the scroll viewport.
     */
    <div style={{
      backgroundColor: C.page,
      position: 'relative',
      minHeight: '100%',
      padding: SP[6],
      paddingBottom: SP[12],
    }}>

      {/* ── CYCLE SUMMARY ──────────────────────────────────────────────
          Anchored to the PAGE SHELL's top-right corner.
          position: absolute, top/right: 0 — flush with the page edge.
          The page's padding (SP[6] = 24px) naturally provides the gap
          between the card and the viewport edge.
      ─────────────────────────────────────────────────────────────── */}
      <div style={{
        position: 'absolute',
        top: 0,
        right: 0,
        backgroundColor: C.card.DEFAULT,        // #1f1f22
        border: `1px solid ${C.border.strong}`,  // #48474a
        borderRadius: R.xl,
        borderTopRightRadius: 0,
        padding: `${SP[4]} ${SP[5]}`,
        minWidth: '180px',
        zIndex: 10,
      }}>
        <p style={{
          fontSize: TY.fontSize['2xs'], fontWeight: TY.fontWeight.bold,
          color: C.text.disabled, letterSpacing: TY.letterSpacing.wider,
          textTransform: 'uppercase', margin: `0 0 ${SP[1]} 0`,
        }}>
          Cycle Summary
        </p>
        <p style={{ fontSize: TY.fontSize.xs, color: C.text.secondary, margin: `0 0 ${SP[1]} 0` }}>
          Tasks Completed
        </p>
        <p className="headline-font" style={{
          fontSize: TY.fontSize['3xl'], fontWeight: TY.fontWeight.bold,
          color: C.text.primary, lineHeight: 1, margin: `0 0 ${SP[3]} 0`,
        }}>
          {doneStories.length}
          <span style={{ fontSize: TY.fontSize.lg, color: C.text.disabled, fontWeight: TY.fontWeight.semibold }}>
            /{sprintStories.length}
          </span>
        </p>
        {/* Gradient accent divider line */}
        <div style={{
          height: '2px',
          background: `linear-gradient(90deg, ${C.accent.DEFAULT}, ${C.accent.dim})`,
          borderRadius: '9999px',
          marginBottom: SP[2.5],
        }} />
        {velocityDelta !== null ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: SP[1] }}>
            {velocityUp
              ? <TrendingUp size={11} color="#4ade80" />
              : <TrendingDown size={11} color="#f87171" />
            }
            <span style={{
              fontSize: TY.fontSize['2xs'], fontWeight: TY.fontWeight.bold,
              color: velocityUp ? '#4ade80' : '#f87171',
              letterSpacing: TY.letterSpacing.wide, textTransform: 'uppercase',
            }}>
              {velocityUp ? '+' : ''}{velocityDelta}% velocity
            </span>
          </div>
        ) : (
          <span style={{ fontSize: TY.fontSize['2xs'], color: C.text.disabled, fontStyle: 'italic' }}>
            First sprint
          </span>
        )}
      </div>

      {/* ── Centered content column ─────────────────────────────────────
          No position: relative — this column does NOT establish a
          positioning context. The CYCLE SUMMARY above is its own element
          in the page shell.
          No backgroundColor — transparent, inherits C.page from parent.
      ─────────────────────────────────────────────────────────────── */}
      <div style={{ maxWidth: '520px', margin: '0 auto' }}>

        {/* Incomplete stories — only shown when needed */}
        {incompleteStories.length > 0 && (
          <IncompleteWarning
            stories={incompleteStories}
            decisions={spillDecisions}
            onDecide={(id, d) => setSpillDecisions(prev => ({ ...prev, [id]: d }))}
            getUserById={getUserById}
            C={C} TY={TY} SP={SP} R={R} transitions={transitions}
          />
        )}

        {/* ── Hero ─────────────────────────────────────────────────────
            textAlign: center, transparent background.
            paddingTop: SP[8] provides clearance from the top of the page.
        ─────────────────────────────────────────────────────────────── */}
        <div style={{ textAlign: 'center', paddingTop: SP[8], paddingBottom: SP[7] }}>
          {/* Flag icon: dark elevated surface, neutral border — NO accent tint */}
          <div style={{
            width: '64px', height: '64px',
            borderRadius: R.xl,
            backgroundColor: C.card.DEFAULT,
            border: `1px solid ${C.border.strong}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: `0 auto ${SP[5]}`,
          }}>
            <Flag size={26} color={C.accent.DEFAULT} />
          </div>

          <h1 className="headline-font" style={{
            fontSize: TY.fontSize['4xl'], fontWeight: TY.fontWeight.bold,
            color: C.text.primary, letterSpacing: TY.letterSpacing.tight,
            lineHeight: TY.lineHeight.tight, margin: `0 0 ${SP[3]} 0`,
          }}>
            End Sprint
          </h1>

          <p style={{
            fontSize: TY.fontSize.sm, color: C.text.secondary,
            lineHeight: TY.lineHeight.relaxed,
            maxWidth: '360px', margin: '0 auto',
          }}>
            Are you ready to finalize the{' '}
            <span style={{ color: C.text.primary, fontWeight: TY.fontWeight.semibold }}>
              {sprint.name}
            </span>{' '}
            performance? This action will archive the current sprint cycle.
          </p>
        </div>

        {/* ── What Happens Next ────────────────────────────────────────
            NO backgroundColor, NO border, NO card wrapper.
            Steps render directly on the page background (#0e0e10).
        ─────────────────────────────────────────────────────────────── */}
        <div style={{ marginBottom: SP[8] }}>
          {/* ─── WHAT HAPPENS NEXT? ─── divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: SP[3], marginBottom: SP[5] }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: C.border.strong }} />
            <span style={{
              fontSize: TY.fontSize['2xs'], fontWeight: TY.fontWeight.bold,
              color: C.accent.DEFAULT, letterSpacing: TY.letterSpacing.wider,
              textTransform: 'uppercase', whiteSpace: 'nowrap',
            }}>
              What happens next?
            </span>
            <div style={{ flex: 1, height: '1px', backgroundColor: C.border.strong }} />
          </div>

          {/* Steps — transparent, on #0e0e10 page background */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: SP[4] }}>
            {STEPS.map((step, i) => (
              <div key={i} style={{ display: 'flex', gap: SP[4] }}>
                {/* Number circle */}
                <div style={{
                  flexShrink: 0,
                  width: '24px', height: '24px',
                  borderRadius: '9999px',
                  backgroundColor: C.accent.bgSubtle,
                  border: `1px solid ${C.accent.DEFAULT}44`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginTop: '2px',
                }}>
                  <span style={{
                    fontSize: TY.fontSize['2xs'], fontWeight: TY.fontWeight.bold,
                    color: C.accent.DEFAULT,
                  }}>
                    {i + 1}
                  </span>
                </div>
                {/* Text */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    fontSize: TY.fontSize.sm, fontWeight: TY.fontWeight.semibold,
                    color: C.text.primary, margin: `0 0 ${SP[0.5]} 0`,
                  }}>
                    {step.title}
                  </p>
                  <p style={{
                    fontSize: TY.fontSize.xs, color: C.text.secondary,
                    lineHeight: TY.lineHeight.relaxed, margin: 0,
                  }}>
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Actions ─────────────────────────────────────────────────── */}
        <div style={{ position: 'relative' }}>
          {/* MVP PENDING badge — bottom-left of the button */}
          <div style={{
            position: 'absolute', bottom: '100%', left: 0,
            marginBottom: SP[2],
            backgroundColor: C.card.DEFAULT,
            border: `1px solid ${C.border.strong}`,
            borderRadius: R.lg,
            padding: `${SP[2]} ${SP[3]}`,
            display: 'flex', alignItems: 'center', gap: SP[2],
          }}>
            <span style={{ fontSize: '18px', lineHeight: 1 }}>🏆</span>
            <div>
              <p style={{
                fontSize: TY.fontSize['2xs'], fontWeight: TY.fontWeight.bold,
                color: C.accent.DEFAULT, letterSpacing: TY.letterSpacing.wider,
                textTransform: 'uppercase', margin: 0,
              }}>
                MVP
              </p>
              <p style={{ fontSize: '9px', color: C.text.disabled, fontWeight: TY.fontWeight.medium, margin: 0 }}>
                Pending...
              </p>
            </div>
          </div>

          {/* End Sprint CTA */}
          <EndSprintBtn
            onClick={handleEnd}
            disabled={isEnding}
            C={C} TY={TY} SP={SP} R={R} transitions={transitions}
          />

          {/* Cancel text link */}
          <button
            onClick={() => router.push('/board')}
            style={{
              display: 'block', width: '100%', marginTop: SP[4],
              background: 'none', border: 'none',
              color: C.text.disabled,
              fontSize: TY.fontSize.xs, fontWeight: TY.fontWeight.bold,
              letterSpacing: TY.letterSpacing.wider, textTransform: 'uppercase',
              cursor: 'pointer', textAlign: 'center',
              transition: `color ${transitions.fast}`,
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = C.text.secondary }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = C.text.disabled }}
          >
            Cancel &amp; Return to Arena
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Incomplete stories warning ───────────────────────────────────────────────

function IncompleteWarning({ stories, decisions, onDecide, getUserById, C, TY, SP, R, transitions }: {
  stories: any[]; decisions: Record<string, 'spill' | 'backlog'>
  onDecide: (id: string, d: 'spill' | 'backlog') => void
  getUserById: (id: string) => any; C: any; TY: any; SP: any; R: any; transitions: any
}) {
  return (
    <div style={{
      backgroundColor: `${C.warning}0d`,
      border: `1px solid ${C.warning}44`,
      borderRadius: R.xl, padding: SP[4], marginBottom: SP[5],
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: SP[2], marginBottom: SP[3] }}>
        <AlertTriangle size={14} color={C.warning} />
        <span style={{ fontSize: TY.fontSize.sm, fontWeight: TY.fontWeight.semibold, color: C.warning }}>
          {stories.length} {stories.length === 1 ? 'story is' : 'stories are'} not complete
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: SP[2] }}>
        {stories.map(story => {
          const assignee = story.assigneeId ? getUserById(story.assigneeId) : null
          const isSpill   = decisions[story.id] === 'spill'
          const isBacklog = decisions[story.id] === 'backlog'
          return (
            <div key={story.id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              gap: SP[3], backgroundColor: C.card.DEFAULT,
              border: `1px solid ${C.border.strong}`, borderRadius: R.lg,
              padding: `${SP[3]} ${SP[4]}`,
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  fontSize: TY.fontSize.sm, fontWeight: TY.fontWeight.medium,
                  color: C.text.primary, margin: `0 0 2px 0`,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {story.title}
                </p>
                <p style={{ fontSize: TY.fontSize.xs, color: C.text.disabled, margin: 0 }}>
                  {STATUS_LABELS[story.status as keyof typeof STATUS_LABELS]}
                  {assignee ? ` · ${assignee.name}` : ''}
                </p>
              </div>
              <div style={{ display: 'flex', gap: SP[2], flexShrink: 0 }}>
                <button
                  onClick={() => onDecide(story.id, 'spill')}
                  style={{
                    fontSize: TY.fontSize['2xs'], fontWeight: TY.fontWeight.bold,
                    padding: `${SP[1]} ${SP[2.5]}`, borderRadius: R.md,
                    border: `1px solid ${isSpill ? C.warning : C.border.strong}`,
                    backgroundColor: isSpill ? `${C.warning}1a` : 'transparent',
                    color: isSpill ? C.warning : C.text.disabled,
                    cursor: 'pointer', transition: `all ${transitions.fast}`,
                  }}
                >
                  Spill Over
                </button>
                <button
                  onClick={() => onDecide(story.id, 'backlog')}
                  style={{
                    fontSize: TY.fontSize['2xs'], fontWeight: TY.fontWeight.bold,
                    padding: `${SP[1]} ${SP[2.5]}`, borderRadius: R.md,
                    border: `1px solid ${C.border.strong}`,
                    backgroundColor: isBacklog ? C.card.sunken : 'transparent',
                    color: isBacklog ? C.text.primary : C.text.disabled,
                    cursor: 'pointer', transition: `all ${transitions.fast}`,
                  }}
                >
                  To Backlog
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── End Sprint button ────────────────────────────────────────────────────────

function EndSprintBtn({ onClick, disabled, C, TY, SP, R, transitions }: any) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      data-testid="confirm-end-sprint-btn"
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: SP[2.5], width: '100%',
        padding: `${SP[4]} ${SP[6]}`,
        borderRadius: R.xl, border: 'none',
        background: disabled
          ? `${C.accent.DEFAULT}44`
          : hovered
          ? `linear-gradient(135deg, ${C.accent.fixedDim}, ${C.accent.DEFAULT})`
          : `linear-gradient(135deg, ${C.accent.DEFAULT}, ${C.accent.fixedDim})`,
        color: disabled ? `${C.text.primary}55` : C.text.primary,  // #f9f5f8 — white
        fontSize: TY.fontSize.sm, fontWeight: TY.fontWeight.bold,
        letterSpacing: TY.letterSpacing.wide, textTransform: 'uppercase',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: `all ${transitions.fast}`,
        boxShadow: hovered && !disabled ? `0 8px 24px ${C.accent.DEFAULT}44` : 'none',
      }}
    >
      <Rocket size={16} />
      End Sprint &amp; Calculate Results
    </button>
  )
}
