'use client'
import { useState } from 'react'
import { useAppStore } from '@/store/app.store'
import { useTheme } from '@/hooks/useTheme'
import { useCurrentUser, useActiveSprint } from '@/hooks'
import {
  Sparkles, RotateCcw, Send, TrendingUp,
  Clock, CheckCircle2, Share2,
} from 'lucide-react'
import { GeneratedStoryCard } from '@/components/ai/GeneratedStoryCard'
import { ErrorBoundary } from '@/components/shared/ErrorBoundary'
import { toast } from 'sonner'
import type { Priority, StoryPoints } from '@/types'

interface GeneratedStory {
  title: string
  description: string
  acceptanceCriteria: string[]
  storyPoints: StoryPoints
  priority: Priority
  tags: string[]
}

const BLUEPRINTS = [
  'User authentication',
  'Payment processing',
  'Dark mode toggle',
  'CSV Data Export',
  'RBAC Permissions',
]

const STATS = [
  { icon: Clock,        label: 'RECENT',   title: 'Onboarding flow',        sub: 'Generated 2 hours ago • 12 Tasks'    },
  { icon: CheckCircle2, label: 'ACCURACY', title: '94.2% Definition Rate',  sub: 'Based on developer acceptance'        },
  { icon: Share2,       label: 'EXPORT',   title: 'Jira / GitHub Sync',     sub: 'Connected via SprintArena Webhooks'   },
]

export default function AIGeneratorPage() {
  const { colors: C, typography: TY, spacing: SP, radius: R, transitions } = useTheme()
  const { workspace, createStory, addToSprint, stories: allStories } = useAppStore()
  const { user: currentUser, isAdmin } = useCurrentUser()
  const { sprint: activeSprint } = useActiveSprint()

  const [input,   setInput]   = useState('')
  const [focused, setFocused] = useState(false)
  const [loading, setLoading] = useState(false)
  const [stories, setStories] = useState<GeneratedStory[]>([])
  const [saved,   setSaved]   = useState(false)

  const velocity = activeSprint
    ? allStories
        .filter(s => s.sprintId === activeSprint.id && s.status === 'done')
        .reduce((sum, s) => sum + (s.storyPoints ?? 0), 0)
    : 0

  const handleGenerate = async () => {
    if (!input.trim() || loading) return
    setLoading(true)
    setSaved(false)
    setStories([])
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: input.trim() }),
      })
      if (!res.ok) throw new Error('failed')
      const data = await res.json()
      setStories(data.stories ?? [])
    } catch {
      toast.error('AI generation failed. Check your API key in settings.')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveAll = () => {
    if (!currentUser || !workspace) return
    stories.forEach(s => {
      const story = createStory({
        title: s.title,
        description: s.description,
        acceptanceCriteria: s.acceptanceCriteria,
        storyPoints: s.storyPoints,
        priority: s.priority,
        tags: s.tags,
        status: isAdmin ? 'backlog' : 'proposed',
        workspaceId: workspace.id,
        createdBy: currentUser.id,
      })
      if (isAdmin && activeSprint) addToSprint(story.id, activeSprint.id)
    })
    setSaved(true)
    toast.success(isAdmin
      ? `${stories.length} stories ${activeSprint ? 'added to sprint' : 'saved to backlog'}!`
      : `${stories.length} stories proposed for admin review!`)
  }

  return (
    <ErrorBoundary context="AI Generator">
      <div
        style={{
          padding: SP[5],
          display: 'flex',
          flexDirection: 'column',
          gap: SP[6],
        }}
      >

        {/* ── Page header ────────────────────────────────────────────────── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: SP[4],
            flexWrap: 'wrap',
          }}
        >
          {/* Left: badge + title + subtitle */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: SP[2] }}>
            <span
              style={{
                display: 'inline-flex',
                alignSelf: 'flex-start',
                padding: `${SP[0.5]} ${SP[2.5]}`,
                border: `1px solid ${C.accent.DEFAULT}`,
                borderRadius: R.full,
                fontSize: TY.fontSize['2xs'],
                fontWeight: TY.fontWeight.bold,
                color: C.accent.DEFAULT,
                letterSpacing: TY.letterSpacing.wider,
                textTransform: 'uppercase',
              }}
            >
              Alpha Access
            </span>

            <h1
              className="headline-font"
              style={{
                fontSize: TY.fontSize['4xl'],
                fontWeight: TY.fontWeight.bold,
                color: C.text.primary,
                letterSpacing: TY.letterSpacing.tight,
                lineHeight: TY.lineHeight.tight,
                margin: 0,
              }}
            >
              AI Backlog
            </h1>

            <p
              style={{
                fontSize: TY.fontSize.sm,
                color: C.text.secondary,
                maxWidth: '480px',
                lineHeight: TY.lineHeight.relaxed,
                margin: 0,
              }}
            >
              Transform nebulous ideas into ready-to-code Agile artifacts.
              The AI Product Manager deconstructs your vision in real-time.
            </p>
          </div>

          {/* Right: sprint velocity */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              gap: SP[1],
              flexShrink: 0,
            }}
          >
            <p
              style={{
                fontSize: TY.fontSize['2xs'],
                fontWeight: TY.fontWeight.bold,
                color: C.text.secondary,
                letterSpacing: TY.letterSpacing.wider,
                textTransform: 'uppercase',
                margin: 0,
              }}
            >
              Sprint Velocity
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: SP[1.5] }}>
              <span
                className="headline-font"
                style={{
                  fontSize: TY.fontSize['3xl'],
                  fontWeight: TY.fontWeight.bold,
                  color: C.accent.DEFAULT,
                  lineHeight: 1,
                }}
              >
                {velocity > 0 ? velocity : '—'}
              </span>
              {velocity > 0 && (
                <span style={{ fontSize: TY.fontSize.sm, color: C.text.secondary }}>pts</span>
              )}
              <TrendingUp size={18} color={C.accent.DEFAULT} />
            </div>
          </div>
        </div>

        {/* ── Two-column input section ────────────────────────────────────── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 260px',
            gap: SP[5],
            alignItems: 'start',
          }}
          className="grid-cols-1 lg:grid-cols-[1fr_260px]"
        >
          {/* Left column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: SP[4] }}>

            {/* Feature vision card */}
            <div
              style={{
                backgroundColor: C.card.DEFAULT,
                border: `1px solid ${C.border.DEFAULT}`,
                borderRadius: R['2xl'],
                padding: SP[5],
                display: 'flex',
                flexDirection: 'column',
                gap: SP[3],
              }}
            >
              <p
                style={{
                  fontSize: TY.fontSize['2xs'],
                  fontWeight: TY.fontWeight.bold,
                  color: C.text.disabled,
                  letterSpacing: TY.letterSpacing.wider,
                  textTransform: 'uppercase',
                  margin: 0,
                }}
              >
                The Feature Vision
              </p>

              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                placeholder={`Describe your feature idea… (e.g., "A real-time notification system for team comments with email fallbacks")`}
                rows={6}
                data-testid="feature-input"
                style={{
                  width: '100%',
                  resize: 'none',
                  backgroundColor: C.input.bg,
                  border: `1px solid ${focused ? C.accent.DEFAULT : C.border.DEFAULT}`,
                  borderRadius: R.lg,
                  padding: `${SP[3]} ${SP[4]}`,
                  fontSize: TY.fontSize.sm,
                  color: C.text.primary,
                  outline: 'none',
                  fontFamily: TY.fontFamily.body,
                  lineHeight: TY.lineHeight.relaxed,
                  boxSizing: 'border-box',
                  boxShadow: focused ? `0 0 0 1px ${C.accent.DEFAULT}` : 'none',
                  transition: `border-color ${transitions.fast}, box-shadow ${transitions.fast}`,
                }}
              />
            </div>

            {/* Common blueprints */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: SP[2] }}>
              <p
                style={{
                  fontSize: TY.fontSize['2xs'],
                  fontWeight: TY.fontWeight.bold,
                  color: C.text.disabled,
                  letterSpacing: TY.letterSpacing.wider,
                  textTransform: 'uppercase',
                  margin: 0,
                }}
              >
                Common Blueprints
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: SP[2] }}>
                {BLUEPRINTS.map(bp => (
                  <BlueprintChip
                    key={bp}
                    label={bp}
                    onClick={() => setInput(bp)}
                    C={C} TY={TY} SP={SP} R={R}
                  />
                ))}
              </div>
            </div>

            {/* Generate button */}
            <GenerateButton
              loading={loading}
              disabled={!input.trim() || loading}
              onClick={handleGenerate}
              C={C} TY={TY} SP={SP} R={R} transitions={transitions}
            />
          </div>

          {/* Right column: AI status panel */}
          <div
            style={{
              backgroundColor: C.card.DEFAULT,
              border: `1px solid ${C.border.DEFAULT}`,
              borderRadius: R['2xl'],
              padding: SP[5],
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: SP[4],
              textAlign: 'center',
            }}
          >
            {/* Bot icon with pulse dot */}
            <div style={{ position: 'relative' }}>
              <div
                style={{
                  width: SP[14],
                  height: SP[14],
                  backgroundColor: C.card.sunken,
                  border: `1px solid ${C.border.DEFAULT}`,
                  borderRadius: R.xl,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span style={{ fontSize: '28px', lineHeight: 1 }}>🤖</span>
              </div>
              <div
                className="animate-pulse"
                style={{
                  position: 'absolute',
                  bottom: '-4px',
                  right: '-4px',
                  width: '12px',
                  height: '12px',
                  borderRadius: '9999px',
                  backgroundColor: C.success,
                  border: `2px solid ${C.card.DEFAULT}`,
                }}
              />
            </div>

            <div>
              <p
                style={{
                  fontSize: TY.fontSize.sm,
                  fontWeight: TY.fontWeight.semibold,
                  color: C.text.primary,
                  marginBottom: SP[1.5],
                }}
              >
                AI Product Manager Ready
              </p>
              <p
                style={{
                  fontSize: TY.fontSize.xs,
                  color: C.text.secondary,
                  lineHeight: TY.lineHeight.relaxed,
                  margin: 0,
                }}
              >
                Input your vision on the left to see the broken-down Agile tasks,
                user stories, and acceptance criteria.
              </p>
            </div>
          </div>
        </div>

        {/* ── Loading skeletons ───────────────────────────────────────────── */}
        {loading && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: SP[4],
            }}
          >
            {[0, 1, 2].map(i => (
              <div
                key={i}
                style={{
                  backgroundColor: C.card.DEFAULT,
                  border: `1px solid ${C.border.subtle}`,
                  borderRadius: R.xl,
                  padding: SP[5],
                  display: 'flex',
                  flexDirection: 'column',
                  gap: SP[3],
                }}
              >
                {[0.3, 0.75, 1, 0.85].map((w, j) => (
                  <div
                    key={j}
                    className="shimmer"
                    style={{
                      height: j === 0 ? '10px' : '14px',
                      borderRadius: R.sm,
                      width: `${w * 100}%`,
                    }}
                  />
                ))}
              </div>
            ))}
          </div>
        )}

        {/* ── Generated stories ───────────────────────────────────────────── */}
        {stories.length > 0 && !loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: SP[4] }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: SP[2],
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: SP[3] }}>
                <p
                  style={{
                    fontSize: TY.fontSize.sm,
                    fontWeight: TY.fontWeight.semibold,
                    color: C.text.primary,
                    margin: 0,
                  }}
                >
                  Generated User Stories
                </p>
                {saved && (
                  <span
                    style={{
                      fontSize: TY.fontSize['2xs'],
                      fontWeight: TY.fontWeight.bold,
                      color: C.success,
                      backgroundColor: C.successBg,
                      border: `1px solid ${C.success}33`,
                      borderRadius: R.full,
                      padding: `${SP[0.5]} ${SP[2.5]}`,
                    }}
                  >
                    ✓ Saved to Workspace
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', gap: SP[2] }}>
                <ActionButton
                  onClick={() => { setStories([]); setSaved(false) }}
                  C={C} TY={TY} SP={SP} R={R} transitions={transitions}
                >
                  <RotateCcw size={13} style={{ marginRight: SP[1.5] }} /> Reset
                </ActionButton>
                {!saved && (
                  <ActionButton
                    primary
                    onClick={handleSaveAll}
                    C={C} TY={TY} SP={SP} R={R} transitions={transitions}
                    testId="save-all-btn"
                  >
                    <Send size={13} style={{ marginRight: SP[1.5] }} />
                    {isAdmin ? (activeSprint ? 'Add to Sprint' : 'Save to Backlog') : 'Propose to Admin'}
                  </ActionButton>
                )}
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: SP[4],
              }}
            >
              {stories.map((story, i) => (
                <GeneratedStoryCard key={i} story={story} index={i} />
              ))}
            </div>
          </div>
        )}

        {/* ── Stats bar ───────────────────────────────────────────────────── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            borderRadius: R.xl,
            overflow: 'hidden',
            border: `1px solid ${C.border.DEFAULT}`,
          }}
          className="grid-cols-1 sm:grid-cols-3"
        >
          {STATS.map((stat, i) => {
            const Icon = stat.icon
            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: SP[3],
                  padding: SP[4],
                  borderRight: i < STATS.length - 1 ? `1px solid ${C.border.DEFAULT}` : 'none',
                  backgroundColor: C.card.DEFAULT,
                }}
              >
                <div
                  style={{
                    width: SP[8],
                    height: SP[8],
                    borderRadius: R.lg,
                    backgroundColor: C.accent.bgSubtle,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Icon size={15} color={C.accent.DEFAULT} />
                </div>
                <div>
                  <p
                    style={{
                      fontSize: TY.fontSize['2xs'],
                      fontWeight: TY.fontWeight.bold,
                      color: C.accent.DEFAULT,
                      letterSpacing: TY.letterSpacing.wider,
                      textTransform: 'uppercase',
                      margin: `0 0 ${SP[0.5]} 0`,
                    }}
                  >
                    {stat.label}
                  </p>
                  <p
                    style={{
                      fontSize: TY.fontSize.sm,
                      fontWeight: TY.fontWeight.semibold,
                      color: C.text.primary,
                      lineHeight: TY.lineHeight.snug,
                      margin: 0,
                    }}
                  >
                    {stat.title}
                  </p>
                  <p
                    style={{
                      fontSize: TY.fontSize.xs,
                      color: C.text.secondary,
                      marginTop: SP[0.5],
                    }}
                  >
                    {stat.sub}
                  </p>
                </div>
              </div>
            )
          })}
        </div>

      </div>
    </ErrorBoundary>
  )
}

// ─── BlueprintChip ────────────────────────────────────────────────────────────

function BlueprintChip({
  label, onClick, C, TY, SP, R,
}: {
  label: string; onClick: () => void
  C: any; TY: any; SP: any; R: any
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
        border: `1px solid ${hovered ? C.accent.DEFAULT : C.border.DEFAULT}`,
        backgroundColor: hovered ? C.accent.bgSubtle : 'transparent',
        color: hovered ? C.accent.DEFAULT : C.text.secondary,
        fontSize: TY.fontSize.xs,
        fontWeight: TY.fontWeight.medium,
        cursor: 'pointer',
        transition: 'all 150ms ease',
      }}
    >
      {label}
    </button>
  )
}

// ─── GenerateButton ───────────────────────────────────────────────────────────

function GenerateButton({
  loading, disabled, onClick, C, TY, SP, R, transitions,
}: {
  loading: boolean; disabled: boolean; onClick: () => void
  C: any; TY: any; SP: any; R: any; transitions: any
}) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      data-testid="generate-btn"
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SP[2],
        padding: `${SP[3]} ${SP[5]}`,
        borderRadius: R.lg,
        border: 'none',
        backgroundColor: disabled
          ? `${C.accent.DEFAULT}55`
          : hovered
          ? C.accent.fixedDim
          : C.accent.DEFAULT,
        color: C.accent.on,
        fontSize: TY.fontSize.sm,
        fontWeight: TY.fontWeight.bold,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: `background-color ${transitions.fast}`,
        letterSpacing: TY.letterSpacing.wide,
      }}
    >
      {loading ? (
        <>
          <div
            style={{
              width: '16px',
              height: '16px',
              border: `2px solid ${C.accent.on}`,
              borderTopColor: 'transparent',
              borderRadius: '9999px',
              animation: 'spin 0.7s linear infinite',
            }}
            className="animate-spin"
          />
          Analyzing...
        </>
      ) : (
        <>
          <Sparkles size={15} />
          Generate Backlog
        </>
      )}
    </button>
  )
}

// ─── ActionButton ─────────────────────────────────────────────────────────────

function ActionButton({
  children, onClick, primary, C, TY, SP, R, transitions, testId,
}: {
  children: React.ReactNode; onClick: () => void; primary?: boolean
  C: any; TY: any; SP: any; R: any; transitions: any; testId?: string
}) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onClick}
      data-testid={testId}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: `${SP[1.5]} ${SP[3]}`,
        borderRadius: R.lg,
        border: primary ? 'none' : `1px solid ${C.border.DEFAULT}`,
        backgroundColor: primary
          ? hovered ? C.accent.fixedDim : C.accent.DEFAULT
          : hovered ? C.card.hover : 'transparent',
        color: primary ? C.accent.on : C.text.secondary,
        fontSize: TY.fontSize.xs,
        fontWeight: TY.fontWeight.semibold,
        cursor: 'pointer',
        transition: `background-color ${transitions.fast}`,
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </button>
  )
}
