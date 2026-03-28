'use client'
import { useAppStore } from '@/store/app.store'
import { useTheme } from '@/hooks/useTheme'
import { formatRelativeTime } from '@/lib/utils'

// ─── Activity feed ────────────────────────────────────────────────────────────
// Merges audit logs + notifications into a unified timeline, newest-first.

interface FeedItem {
  id: string
  text: React.ReactNode
  time: string
  dot: string        // color for the timeline dot
}

const STATUS_CHIP_COLORS: Record<string, { bg: string; text: string }> = {
  done:        { bg: 'rgba(74,222,128,0.15)',  text: '#4ade80' },
  in_progress: { bg: 'rgba(251,191,36,0.15)', text: '#fbbf24' },
  review:      { bg: 'rgba(96,165,250,0.15)', text: '#60a5fa' },
  todo:        { bg: 'rgba(148,163,184,0.12)', text: '#94a3b8' },
}

export function RecentActivity() {
  const { colors: C, typography: TY, spacing: SP, radius: R } = useTheme()
  const { auditLogs, notifications, getUserById } = useAppStore()

  // Build unified feed from audit logs + notifications
  const auditItems = auditLogs.slice(0, 20).map(log => {
    const user   = getUserById(log.userId)
    const name   = user?.name ?? 'Someone'
    const newVal = log.newValue as Record<string, string> | undefined

    let text: React.ReactNode = `${name} performed ${log.action}`
    let dot: string = C.accent.DEFAULT

    if (log.action === 'story.moved' && newVal?.status) {
      const chip = STATUS_CHIP_COLORS[newVal.status]
      const label = newVal.status.replace('_', ' ').toUpperCase()
      text = (
        <>
          <strong style={{ color: C.text.primary }}>{name}</strong>
          {' moved '}
          <span style={{ color: C.accent.DEFAULT }}>#{log.entityId.slice(0, 6).toUpperCase()}</span>
          {' to '}
          {chip ? (
            <span style={{
              padding: '1px 6px', borderRadius: '4px',
              backgroundColor: chip.bg, color: chip.text,
              fontSize: TY.fontSize['2xs'], fontWeight: TY.fontWeight.bold,
              verticalAlign: 'middle',
            }}>
              {label}
            </span>
          ) : label}
        </>
      )
      dot = chip?.text ?? C.accent.DEFAULT
    } else if (log.action === 'story.assigned') {
      text = (
        <>
          <strong style={{ color: C.text.primary }}>{name}</strong>
          {' was assigned '}
          <span style={{ color: C.accent.DEFAULT }}>#{log.entityId.slice(0, 6).toUpperCase()}</span>
        </>
      )
      dot = C.warning
    }

    return { id: log.id, text, time: log.createdAt, dot }
  })

  const notifItems = notifications.slice(0, 10).map(n => {
    let text: React.ReactNode = n.title
    let dot: string = C.accent.DEFAULT

    if (n.type === 'sprint_start') {
      text = <><strong style={{ color: C.text.primary }}>Sprint started</strong>{n.body ? ` — ${n.body}` : ''}</>
      dot = C.success
    } else if (n.type === 'sprint_end') {
      text = <><strong style={{ color: C.text.primary }}>Sprint ended</strong>{n.body ? ` — ${n.body}` : ''}</>
      dot = C.warning
    } else if (n.type === 'approval') {
      text = <><strong style={{ color: C.text.primary }}>{n.title}</strong></>
      dot = C.success
    } else if (n.type === 'blocker') {
      text = <><strong style={{ color: C.text.primary }}>{n.title}</strong></>
      dot = C.error
    } else {
      text = <span style={{ color: C.text.secondary }}>{n.title}</span>
    }

    return { id: n.id, text, time: n.createdAt, dot }
  })

  // Merge and sort newest-first, cap at 8
  const feed: FeedItem[] = [...auditItems, ...notifItems]
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    .slice(0, 8)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: SP[4] }}>

      {/* ── Activity Feed card ──────────────────────────────────────────── */}
      <div style={{
        backgroundColor: C.card.DEFAULT,
        border: `1px solid ${C.border.subtle}`,
        borderRadius: R.xl,
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: `${SP[4]} ${SP[5]}`,
          borderBottom: `1px solid ${C.border.subtle}`,
        }}>
          <p style={{
            fontSize: TY.fontSize.sm, fontWeight: TY.fontWeight.semibold,
            color: C.text.primary, margin: 0,
            fontFamily: TY.fontFamily.headline,
          }}>
            Activity Feed
          </p>

          {/* LIVE badge */}
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: SP[1],
            padding: `${SP[0.5]} ${SP[2]}`,
            backgroundColor: 'rgba(74,222,128,0.10)',
            border: '1px solid rgba(74,222,128,0.20)',
            borderRadius: R.full,
            fontSize: TY.fontSize['2xs'], fontWeight: TY.fontWeight.bold,
            color: C.success, letterSpacing: TY.letterSpacing.wider,
          }}>
            <span
              className="animate-pulse"
              style={{
                width: '6px', height: '6px',
                borderRadius: '9999px', backgroundColor: C.success,
              }}
            />
            LIVE
          </span>
        </div>

        {/* Feed items */}
        {feed.length === 0 ? (
          <div style={{ padding: `${SP[8]} ${SP[5]}`, textAlign: 'center' }}>
            <p style={{ fontSize: TY.fontSize.sm, color: C.text.secondary, margin: 0 }}>
              No activity yet.
            </p>
            <p style={{ fontSize: TY.fontSize.xs, color: C.text.disabled, marginTop: SP[1] }}>
              Start moving stories!
            </p>
          </div>
        ) : (
          <div style={{ padding: `${SP[2]} 0` }}>
            {feed.map((item, i) => (
              <div
                key={item.id}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: SP[3],
                  padding: `${SP[2.5]} ${SP[5]}`,
                  borderTop: i > 0 ? `1px solid ${C.border.subtle}` : 'none',
                }}
              >
                {/* Timeline dot */}
                <div style={{
                  width: '7px', height: '7px',
                  borderRadius: '9999px',
                  backgroundColor: item.dot,
                  flexShrink: 0, marginTop: '5px',
                }} />

                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    fontSize: TY.fontSize.xs,
                    color: C.text.secondary,
                    lineHeight: TY.lineHeight.snug,
                    margin: 0,
                  }}>
                    {item.text}
                  </p>
                  <p style={{
                    fontSize: TY.fontSize['2xs'],
                    color: C.text.disabled,
                    marginTop: '3px',
                    letterSpacing: TY.letterSpacing.wide,
                    textTransform: 'uppercase',
                  }}>
                    {formatRelativeTime(item.time)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Arena Intelligence card ──────────────────────────────────────── */}
      <ArenaIntelligence C={C} TY={TY} SP={SP} R={R} />
    </div>
  )
}

function ArenaIntelligence({ C, TY, SP, R }: { C: any; TY: any; SP: any; R: any }) {
  return (
    <div style={{
      borderRadius: R.xl, padding: SP[5],
      position: 'relative', overflow: 'hidden',
      background: `linear-gradient(135deg, ${C.card.DEFAULT} 0%, rgba(204,151,255,0.06) 100%)`,
      border: `1px solid rgba(204,151,255,0.18)`,
    }}>
      {/* Glow orb */}
      <div style={{
        position: 'absolute', top: '-20px', right: '-20px',
        width: '80px', height: '80px',
        borderRadius: '9999px', backgroundColor: C.accent.bgSubtle,
        filter: 'blur(30px)', pointerEvents: 'none',
      }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Icon + label row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: SP[2], marginBottom: SP[3] }}>
          <div style={{
            width: SP[7], height: SP[7],
            backgroundColor: C.accent.bgSubtle,
            borderRadius: R.md,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '14px',
          }}>
            🧠
          </div>
          <p style={{
            fontSize: TY.fontSize['2xs'], fontWeight: TY.fontWeight.bold,
            color: C.accent.DEFAULT, letterSpacing: TY.letterSpacing.wider,
            textTransform: 'uppercase', margin: 0,
          }}>
            Arena Intelligence
          </p>
        </div>

        <p style={{
          fontSize: TY.fontSize.xs, color: C.text.secondary,
          lineHeight: TY.lineHeight.relaxed, margin: 0,
          fontStyle: 'italic',
        }}>
          "Team capacity is trending higher than last sprint. Consider pulling additional
          stories from the stretch backlog to maintain velocity."
        </p>
      </div>
    </div>
  )
}
