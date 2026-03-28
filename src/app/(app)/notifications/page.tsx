'use client'
import { useState } from 'react'
import { useAppStore } from '@/store/app.store'
import { useTheme } from '@/hooks/useTheme'
import { useCurrentUser } from '@/hooks'
import { formatRelativeTime } from '@/lib/utils'
import Link from 'next/link'
import {
  Rocket, Flag, User, CheckCircle2, XCircle, Trophy,
  Lightbulb, AlertTriangle, Bell, Sparkles, Settings,
  ExternalLink, Check,
} from 'lucide-react'
import type { Notification } from '@/types'

// ─── Type metadata ────────────────────────────────────────────────────────────

interface TypeMeta {
  icon: React.FC<{ size?: number; color?: string }>
  iconColor: string
  iconBg: string
  borderColor: string
}

function useTypeMeta(C: any): Record<string, TypeMeta> {
  return {
    sprint_start: { icon: Rocket,        iconColor: C.accent.DEFAULT,  iconBg: C.accent.bgSubtle,              borderColor: `${C.accent.DEFAULT}33`  },
    sprint_end:   { icon: Flag,          iconColor: '#60a5fa',          iconBg: 'rgba(96,165,250,0.10)',        borderColor: 'rgba(96,165,250,0.25)'   },
    assignment:   { icon: User,          iconColor: C.accent.DEFAULT,   iconBg: C.accent.bgSubtle,              borderColor: `${C.accent.DEFAULT}33`  },
    approval:     { icon: CheckCircle2,  iconColor: C.success,          iconBg: 'rgba(74,222,128,0.10)',        borderColor: 'rgba(74,222,128,0.25)'   },
    rejection:    { icon: XCircle,       iconColor: C.error,            iconBg: 'rgba(248,113,113,0.10)',       borderColor: 'rgba(248,113,113,0.25)'  },
    winner:       { icon: Trophy,        iconColor: '#fbbf24',          iconBg: 'rgba(251,191,36,0.10)',        borderColor: 'rgba(251,191,36,0.25)'   },
    proposal:     { icon: Lightbulb,     iconColor: C.accent.DEFAULT,   iconBg: C.accent.bgSubtle,              borderColor: `${C.accent.DEFAULT}33`  },
    blocker:      { icon: AlertTriangle, iconColor: '#f97316',          iconBg: 'rgba(249,115,22,0.10)',        borderColor: 'rgba(249,115,22,0.25)'   },
  }
}

const ACTION_LABELS: Record<string, string> = {
  sprint_start: 'View Sprint Board',
  sprint_end:   'View Results',
  assignment:   'Review Story',
  approval:     'View Backlog',
  rejection:    'View Story',
  winner:       'View Hall of Fame',
  proposal:     'Review Proposal',
  blocker:      'View Milestone',
}

export default function NotificationsPage() {
  const { colors: C, typography: TY, spacing: SP, radius: R, transitions } = useTheme()
  const { notifications, markNotificationRead, markAllRead } = useAppStore()
  const { user: currentUser } = useCurrentUser()
  const typeMeta = useTypeMeta(C)

  if (!currentUser) return null

  const myNotifs = notifications.filter(n => !n.userId || n.userId === currentUser.id)
  const unreadCount = myNotifs.filter(n => !n.readAt).length

  // Default fallback meta for unknown types
  const fallback: TypeMeta = {
    icon: Bell,
    iconColor: C.text.secondary,
    iconBg: C.card.sunken,
    borderColor: C.border.DEFAULT,
  }

  return (
    <div style={{ padding: SP[6], maxWidth: '720px', display: 'flex', flexDirection: 'column', gap: SP[6] }}>

      {/* ── Page header ────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: SP[4] }}>
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
          Notifications
        </h1>

        <div style={{ display: 'flex', alignItems: 'center', gap: SP[3], flexShrink: 0 }}>
          {/* Unread count badge */}
          {unreadCount > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: SP[1.5] }}>
              <span
                className="headline-font"
                style={{
                  fontSize: TY.fontSize.xl,
                  fontWeight: TY.fontWeight.bold,
                  color: C.accent.DEFAULT,
                  lineHeight: 1,
                }}
              >
                {unreadCount}
              </span>
              <span style={{
                fontSize: TY.fontSize.xs,
                fontWeight: TY.fontWeight.bold,
                color: C.text.secondary,
                letterSpacing: TY.letterSpacing.wider,
                textTransform: 'uppercase',
              }}>
                Unread
              </span>
            </div>
          )}

          {/* Mark all read */}
          {unreadCount > 0 && (
            <MarkAllBtn
              onClick={() => markAllRead(currentUser.id)}
              C={C} TY={TY} SP={SP} R={R} transitions={transitions}
            />
          )}
        </div>
      </div>

      {/* ── Notification list ───────────────────────────────────────────── */}
      {myNotifs.length === 0 ? (
        <EmptyNotifications C={C} TY={TY} SP={SP} R={R} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: SP[3] }}>
          {myNotifs.map(notif => {
            const meta = typeMeta[notif.type] ?? fallback
            const actionLabel = ACTION_LABELS[notif.type] ?? 'View'
            return (
              <NotifCard
                key={notif.id}
                notif={notif}
                meta={meta}
                actionLabel={actionLabel}
                onMarkRead={() => markNotificationRead(notif.id)}
                C={C} TY={TY} SP={SP} R={R} transitions={transitions}
              />
            )
          })}
        </div>
      )}

      {/* ── Bottom 2-col cards ──────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: SP[4] }}
           className="grid-cols-1 sm:grid-cols-2">
        <PreferencesCard C={C} TY={TY} SP={SP} R={R} transitions={transitions} />
        <SmartFiltersCard C={C} TY={TY} SP={SP} R={R} />
      </div>
    </div>
  )
}

// ─── NotifCard ────────────────────────────────────────────────────────────────

function NotifCard({
  notif, meta, actionLabel, onMarkRead,
  C, TY, SP, R, transitions,
}: {
  notif: Notification
  meta: TypeMeta
  actionLabel: string
  onMarkRead: () => void
  C: any; TY: any; SP: any; R: any; transitions: any
}) {
  const [hovered, setHovered] = useState(false)
  const isRead = !!notif.readAt
  const Icon   = meta.icon

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        backgroundColor: C.card.DEFAULT,
        border: `1px solid ${isRead ? C.border.subtle : meta.borderColor}`,
        borderRadius: R.xl,
        padding: SP[5],
        display: 'flex',
        alignItems: 'flex-start',
        gap: SP[4],
        opacity: isRead ? 0.55 : 1,
        transition: `border-color ${transitions.fast}, opacity ${transitions.fast}`,
        position: 'relative',
      }}
    >
      {/* Icon square */}
      <div style={{
        width: SP[10],
        height: SP[10],
        borderRadius: R.lg,
        backgroundColor: meta.iconBg,
        border: `1px solid ${meta.borderColor}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Icon size={18} color={meta.iconColor} />
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontSize: TY.fontSize.sm,
          fontWeight: TY.fontWeight.semibold,
          color: isRead ? C.text.secondary : C.text.primary,
          margin: `0 0 ${SP[1]} 0`,
          lineHeight: TY.lineHeight.snug,
        }}>
          {notif.title}
        </p>

        {notif.body && (
          <p style={{
            fontSize: TY.fontSize.xs,
            color: C.text.secondary,
            lineHeight: TY.lineHeight.relaxed,
            margin: `0 0 ${SP[2.5]} 0`,
          }}>
            {notif.body}
          </p>
        )}

        {/* Action link */}
        {notif.actionUrl && (
          <Link
            href={notif.actionUrl}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: SP[1],
              fontSize: TY.fontSize.xs,
              fontWeight: TY.fontWeight.semibold,
              color: C.accent.DEFAULT,
              textDecoration: 'none',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.textDecoration = 'underline' }}
            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.textDecoration = 'none' }}
          >
            {actionLabel}
            <ExternalLink size={10} />
          </Link>
        )}
      </div>

      {/* Timestamp + mark-read — top right */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: SP[2],
        flexShrink: 0,
      }}>
        <span style={{
          fontSize: TY.fontSize['2xs'],
          color: C.text.disabled,
          letterSpacing: TY.letterSpacing.wide,
          whiteSpace: 'nowrap',
        }}>
          {formatRelativeTime(notif.createdAt)}
        </span>

        {!isRead && (
          <button
            onClick={onMarkRead}
            title="Mark as read"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '22px',
              height: '22px',
              borderRadius: '9999px',
              border: `1px solid ${C.border.DEFAULT}`,
              backgroundColor: hovered ? C.card.hover : 'transparent',
              color: C.text.disabled,
              cursor: 'pointer',
              transition: `all ${transitions.fast}`,
            }}
            onMouseEnter={e => {
              const b = e.currentTarget as HTMLButtonElement
              b.style.borderColor = C.success
              b.style.color = C.success
            }}
            onMouseLeave={e => {
              const b = e.currentTarget as HTMLButtonElement
              b.style.borderColor = C.border.DEFAULT
              b.style.color = C.text.disabled
            }}
          >
            <Check size={11} />
          </button>
        )}
      </div>
    </div>
  )
}

// ─── MarkAllBtn ───────────────────────────────────────────────────────────────

function MarkAllBtn({ onClick, C, TY, SP, R, transitions }: any) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: `${SP[1.5]} ${SP[3]}`,
        borderRadius: R.lg,
        border: `1px solid ${C.border.DEFAULT}`,
        backgroundColor: hovered ? C.card.hover : 'transparent',
        color: hovered ? C.text.primary : C.text.secondary,
        fontSize: TY.fontSize.xs,
        fontWeight: TY.fontWeight.semibold,
        cursor: 'pointer',
        transition: `all ${transitions.fast}`,
        whiteSpace: 'nowrap',
      }}
    >
      Mark all read
    </button>
  )
}

// ─── PreferencesCard ──────────────────────────────────────────────────────────

function PreferencesCard({ C, TY, SP, R, transitions }: any) {
  const [hovered, setHovered] = useState(false)
  return (
    <div style={{
      backgroundColor: C.card.DEFAULT,
      border: `1px solid ${C.border.DEFAULT}`,
      borderRadius: R.xl,
      padding: SP[5],
      display: 'flex',
      flexDirection: 'column',
      gap: SP[3],
    }}>
      <div>
        <p style={{
          fontSize: TY.fontSize.sm,
          fontWeight: TY.fontWeight.semibold,
          color: C.text.primary,
          margin: `0 0 ${SP[1.5]} 0`,
        }}>
          Notification Preferences
        </p>
        <p style={{
          fontSize: TY.fontSize.xs,
          color: C.text.secondary,
          lineHeight: TY.lineHeight.relaxed,
          margin: 0,
        }}>
          Fine-tune your experience. Choose how and when you receive sprint updates across Email, Slack, and Mobile.
        </p>
      </div>

      <button
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: SP[1.5],
          padding: `${SP[2]} ${SP[3.5]}`,
          borderRadius: R.md,
          border: `1px solid ${C.border.DEFAULT}`,
          backgroundColor: hovered ? C.card.hover : 'transparent',
          color: C.text.secondary,
          fontSize: TY.fontSize.xs,
          fontWeight: TY.fontWeight.semibold,
          cursor: 'pointer',
          alignSelf: 'flex-start',
          transition: `all ${transitions.fast}`,
        }}
      >
        <Settings size={13} />
        Configure Settings
      </button>
    </div>
  )
}

// ─── SmartFiltersCard ─────────────────────────────────────────────────────────

function SmartFiltersCard({ C, TY, SP, R }: any) {
  return (
    <div style={{
      borderRadius: R.xl,
      padding: SP[5],
      position: 'relative',
      overflow: 'hidden',
      background: `linear-gradient(135deg, ${C.card.DEFAULT} 0%, rgba(204,151,255,0.07) 100%)`,
      border: `1px solid rgba(204,151,255,0.20)`,
      display: 'flex',
      flexDirection: 'column',
      gap: SP[3],
    }}>
      {/* Glow orb */}
      <div style={{
        position: 'absolute',
        top: '-20px', right: '-20px',
        width: '80px', height: '80px',
        borderRadius: '9999px',
        backgroundColor: C.accent.bgSubtle,
        filter: 'blur(28px)',
        pointerEvents: 'none',
      }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Icon */}
        <div style={{
          width: SP[10],
          height: SP[10],
          backgroundColor: C.accent.bgSubtle,
          border: `1px solid ${C.accent.DEFAULT}33`,
          borderRadius: R.lg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: SP[3],
        }}>
          <Sparkles size={18} color={C.accent.DEFAULT} />
        </div>

        <p style={{
          fontSize: TY.fontSize.sm,
          fontWeight: TY.fontWeight.semibold,
          color: C.text.primary,
          margin: `0 0 ${SP[1.5]} 0`,
        }}>
          Smart Filters
        </p>
        <p style={{
          fontSize: TY.fontSize.xs,
          color: C.text.secondary,
          lineHeight: TY.lineHeight.relaxed,
          margin: 0,
        }}>
          Let AI prioritize the most critical updates for your current role.
        </p>
      </div>
    </div>
  )
}

// ─── EmptyNotifications ───────────────────────────────────────────────────────

function EmptyNotifications({ C, TY, SP, R }: any) {
  return (
    <div style={{
      textAlign: 'center',
      padding: `${SP[16]} ${SP[8]}`,
      backgroundColor: C.card.DEFAULT,
      border: `1px solid ${C.border.subtle}`,
      borderRadius: R.xl,
    }}>
      <div style={{
        width: SP[12],
        height: SP[12],
        borderRadius: '9999px',
        backgroundColor: C.accent.bgSubtle,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: `0 auto ${SP[4]}`,
      }}>
        <Bell size={22} color={C.accent.DEFAULT} />
      </div>
      <p style={{
        fontSize: TY.fontSize.base,
        fontWeight: TY.fontWeight.semibold,
        color: C.text.primary,
        margin: `0 0 ${SP[1]} 0`,
      }}>
        All caught up!
      </p>
      <p style={{ fontSize: TY.fontSize.sm, color: C.text.secondary, margin: 0 }}>
        No notifications yet. Sprint activity will appear here.
      </p>
    </div>
  )
}
