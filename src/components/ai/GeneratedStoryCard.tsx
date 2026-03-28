'use client'
import { useTheme } from '@/hooks/useTheme'
import { CheckCircle2 } from 'lucide-react'
import type { Priority, StoryPoints } from '@/types'

interface GeneratedStory {
  title: string
  description: string
  acceptanceCriteria: string[]
  storyPoints: StoryPoints
  priority: Priority
  tags: string[]
}

// ─── Priority config ──────────────────────────────────────────────────────────

const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; bg: string }> = {
  low:      { label: 'Low',      color: '#4ade80', bg: 'rgba(74,222,128,0.10)'  },
  medium:   { label: 'Medium',   color: '#fbbf24', bg: 'rgba(251,191,36,0.10)'  },
  high:     { label: 'High',     color: '#f97316', bg: 'rgba(249,115,22,0.10)'  },
  critical: { label: 'Critical', color: '#f87171', bg: 'rgba(248,113,113,0.10)' },
}

export function GeneratedStoryCard({ story, index }: { story: GeneratedStory; index: number }) {
  const { colors: C, typography: TY, spacing: SP, radius: R } = useTheme()
  const p = PRIORITY_CONFIG[story.priority] ?? PRIORITY_CONFIG.medium

  return (
    <div
      className="fade-in-up"
      style={{
        backgroundColor: C.card.DEFAULT,
        border: `1px solid ${C.border.DEFAULT}`,
        borderRadius: R.xl,
        padding: SP[5],
        display: 'flex',
        flexDirection: 'column',
        gap: SP[3],
        animationDelay: `${index * 80}ms`,
        transition: `border-color 150ms ease`,
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = C.border.strong }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = C.border.DEFAULT }}
    >
      {/* ── Header row ─────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: SP[2], flexWrap: 'wrap' }}>
        {/* Priority badge */}
        <span
          style={{
            padding: `${SP[0.5]} ${SP[2]}`,
            borderRadius: R.full,
            fontSize: TY.fontSize['2xs'],
            fontWeight: TY.fontWeight.bold,
            color: p.color,
            backgroundColor: p.bg,
            letterSpacing: TY.letterSpacing.wide,
            textTransform: 'uppercase',
          }}
        >
          {p.label}
        </span>

        {/* Points badge */}
        <span
          style={{
            padding: `${SP[0.5]} ${SP[2]}`,
            borderRadius: R.full,
            fontSize: TY.fontSize['2xs'],
            fontWeight: TY.fontWeight.bold,
            color: C.accent.DEFAULT,
            backgroundColor: C.accent.bgSubtle,
          }}
        >
          {story.storyPoints} pts
        </span>

        {/* Status chip */}
        <span
          style={{
            marginLeft: 'auto',
            padding: `${SP[0.5]} ${SP[2]}`,
            borderRadius: R.full,
            fontSize: TY.fontSize['2xs'],
            fontWeight: TY.fontWeight.bold,
            color: C.text.disabled,
            border: `1px solid ${C.border.DEFAULT}`,
            letterSpacing: TY.letterSpacing.wide,
            textTransform: 'uppercase',
          }}
        >
          TODO
        </span>
      </div>

      {/* ── Title ──────────────────────────────────────────────────────────── */}
      <p
        style={{
          fontSize: TY.fontSize.sm,
          fontWeight: TY.fontWeight.semibold,
          color: C.accent.DEFAULT,
          lineHeight: TY.lineHeight.snug,
          margin: 0,
        }}
      >
        {story.title}
      </p>

      {/* ── Description ────────────────────────────────────────────────────── */}
      <p
        style={{
          fontSize: TY.fontSize.xs,
          color: C.text.secondary,
          lineHeight: TY.lineHeight.relaxed,
          margin: 0,
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {story.description}
      </p>

      {/* ── Acceptance criteria ─────────────────────────────────────────────── */}
      {story.acceptanceCriteria.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: SP[1.5] }}>
          {story.acceptanceCriteria.map((ac, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: SP[2] }}>
              <CheckCircle2
                size={11}
                color={`${C.accent.DEFAULT}aa`}
                style={{ flexShrink: 0, marginTop: '2px' }}
              />
              <span
                style={{
                  fontSize: TY.fontSize.xs,
                  color: C.text.secondary,
                  lineHeight: TY.lineHeight.relaxed,
                }}
              >
                {ac}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* ── Tags ────────────────────────────────────────────────────────────── */}
      {story.tags.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: SP[1.5],
            paddingTop: SP[3],
            borderTop: `1px solid ${C.border.subtle}`,
          }}
        >
          {story.tags.map(tag => (
            <span
              key={tag}
              style={{
                fontSize: TY.fontSize['2xs'],
                color: C.text.disabled,
                backgroundColor: C.card.sunken,
                border: `1px solid ${C.border.subtle}`,
                borderRadius: R.full,
                padding: `${SP[0.5]} ${SP[2]}`,
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
