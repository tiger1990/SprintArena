'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAppStore } from '@/store/app.store'
import { useCurrentUser } from '@/hooks'
import { useTheme } from '@/hooks/useTheme'
import { Avatar } from '@/components/shared/Avatar'
import {
  LayoutDashboard, Brain, Kanban, BookOpen,
  Users, Trophy, Bell, Settings, LogOut,
  FileText, Plus, Swords,
} from 'lucide-react'
import { useState } from 'react'

// ─── Nav config ───────────────────────────────────────────────────────────────

const MAIN_NAV = [
  { href: '/dashboard',        label: 'Dashboard',    icon: LayoutDashboard, adminOnly: false },
  { href: '/ai-generator',     label: 'AI Backlog',   icon: Brain,           adminOnly: false },
  { href: '/board',            label: 'Kanban Board', icon: Kanban,          adminOnly: false },
  { href: '/backlog',          label: 'Backlog',      icon: BookOpen,        adminOnly: false },
  { href: '/backlog/proposed', label: 'Proposed',     icon: FileText,        adminOnly: true  },
  { href: '/team',             label: 'Team',         icon: Users,           adminOnly: true  },
  { href: '/hall-of-fame',     label: 'Hall of Fame', icon: Trophy,          adminOnly: false },
]

const BOTTOM_NAV = [
  { href: '/notifications', label: 'Notifications', icon: Bell    },
  { href: '/settings',      label: 'Settings',      icon: Settings },
]

// ─── Component ────────────────────────────────────────────────────────────────

export function Sidebar() {
  const { colors, typography: TY, spacing: SP, radius: R, transitions } = useTheme()
  const pathname    = usePathname()
  const router      = useRouter()
  const { workspace, logout, getUnreadCount } = useAppStore()
  const { user: currentUser, isAdmin }        = useCurrentUser()

  if (!currentUser || !workspace) return null

  const unread       = getUnreadCount(currentUser.id)
  const visibleMain  = MAIN_NAV.filter(item => !item.adminOnly || isAdmin)

  const C    = colors
  const allNav = [...MAIN_NAV, ...BOTTOM_NAV]

  /**
   * isActive — returns true only when href is the best (most specific) match.
   * Prevents /backlog from being highlighted while on /backlog/proposed.
   */
  function isActive(href: string) {
    if (pathname === href) return true
    if (!pathname.startsWith(href + '/')) return false
    // A more-specific sibling nav item already claims this path
    const moreSpecific = allNav.some(
      item => item.href !== href
        && item.href.startsWith(href + '/')
        && pathname.startsWith(item.href),
    )
    return !moreSpecific
  }

  return (
    <aside
      style={{
        width: '240px',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        backgroundColor: C.panel.left,
        borderRight: `1px solid ${C.border.subtle}`,
        overflowY: 'auto',
        overflowX: 'hidden',
      }}
      className="hidden md:flex"
    >
      {/* ── Brand ─────────────────────────────────────────────────────────── */}
      <div
        style={{
          padding: `${SP[5]} ${SP[4]}`,
          borderBottom: `1px solid ${C.border.subtle}`,
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: SP[2.5] }}>
          <div
            style={{
              width: SP[8],
              height: SP[8],
              backgroundColor: C.accent.DEFAULT,
              borderRadius: R.lg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: `0 0 12px ${C.accent.bgSubtle}`,
            }}
          >
            <Swords size={15} color={C.accent.on} />
          </div>
          <div style={{ minWidth: 0 }}>
            <p
              className="headline-font"
              style={{
                fontSize: TY.fontSize.base,
                fontWeight: TY.fontWeight.bold,
                color: C.text.primary,
                lineHeight: TY.lineHeight.tight,
              }}
            >
              SprintArena
            </p>
            <p
              style={{
                fontSize: TY.fontSize['2xs'],
                fontWeight: TY.fontWeight.bold,
                color: C.accent.DEFAULT,
                letterSpacing: TY.letterSpacing.wide,
                textTransform: 'uppercase',
                lineHeight: TY.lineHeight.snug,
                marginTop: '2px',
              }}
            >
              For Digital Velodrome
            </p>
          </div>
        </div>
      </div>

      {/* ── Main nav ──────────────────────────────────────────────────────── */}
      <nav
        style={{
          flex: 1,
          padding: `${SP[3]} ${SP[2]}`,
          display: 'flex',
          flexDirection: 'column',
          gap: SP[0.5],
          overflowY: 'auto',
        }}
      >
        {visibleMain.map(item => (
          <NavItem
            key={item.href}
            href={item.href}
            label={item.label}
            icon={item.icon}
            active={isActive(item.href)}
            badge={item.href === '/notifications' ? unread : 0}
            C={C}
            TY={TY}
            SP={SP}
            R={R}
          />
        ))}
      </nav>

      {/* ── Divider ───────────────────────────────────────────────────────── */}
      <div style={{ height: '1px', backgroundColor: C.border.subtle, margin: `0 ${SP[4]}` }} />

      {/* ── Bottom nav ────────────────────────────────────────────────────── */}
      <div style={{ padding: `${SP[2]} ${SP[2]}`, display: 'flex', flexDirection: 'column', gap: SP[0.5] }}>
        {BOTTOM_NAV.map(item => (
          <NavItem
            key={item.href}
            href={item.href}
            label={item.label}
            icon={item.icon}
            active={isActive(item.href)}
            badge={item.href === '/notifications' ? unread : 0}
            C={C}
            TY={TY}
            SP={SP}
            R={R}
          />
        ))}

        {/* Logout row */}
        <button
          onClick={logout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: SP[3],
            padding: `${SP[2]} ${SP[3]}`,
            borderRadius: R.lg,
            border: 'none',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            width: '100%',
            textAlign: 'left',
            color: C.text.disabled,
            fontSize: TY.fontSize.sm,
            fontWeight: TY.fontWeight.medium,
            transition: `color ${transitions.fast}`,
          }}
          onMouseEnter={e => { e.currentTarget.style.color = C.text.secondary }}
          onMouseLeave={e => { e.currentTarget.style.color = C.text.disabled  }}
        >
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>

      {/* ── Start Sprint CTA ──────────────────────────────────────────────── */}
      {isAdmin && (
        <div style={{ padding: SP[3], flexShrink: 0 }}>
          <button
            onClick={() => router.push('/sprints/new')}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: SP[2],
              padding: `${SP[2.5]} ${SP[4]}`,
              borderRadius: R.lg,
              border: 'none',
              backgroundColor: C.accent.DEFAULT,
              color: C.accent.on,
              fontSize: TY.fontSize.sm,
              fontWeight: TY.fontWeight.bold,
              cursor: 'pointer',
              transition: `background-color ${transitions.fast}`,
            }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = C.accent.fixedDim }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = C.accent.DEFAULT  }}
          >
            <Plus size={15} />
            Start Sprint
          </button>
        </div>
      )}

      {/* ── User strip ────────────────────────────────────────────────────── */}
      <div
        style={{
          borderTop: `1px solid ${C.border.subtle}`,
          padding: SP[3],
          display: 'flex',
          alignItems: 'center',
          gap: SP[2.5],
          flexShrink: 0,
        }}
      >
        <Avatar user={currentUser} size="sm" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: TY.fontSize.xs, fontWeight: TY.fontWeight.semibold, color: C.text.primary, truncate: true }}>
            {currentUser.name}
          </p>
          <p style={{ fontSize: TY.fontSize['2xs'], color: C.text.secondary, textTransform: 'capitalize' }}>
            {currentUser.role}
          </p>
        </div>
      </div>
    </aside>
  )
}

// ─── NavItem ──────────────────────────────────────────────────────────────────

function NavItem({
  href, label, icon: Icon, active, badge, C, TY, SP, R,
}: {
  href: string; label: string; icon: any; active: boolean
  badge: number; C: any; TY: any; SP: any; R: any
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <Link
      href={href}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: SP[3],
        padding: `${SP[2]} ${SP[3]}`,
        borderRadius: R.lg,
        textDecoration: 'none',
        fontSize: TY.fontSize.sm,
        fontWeight: active ? TY.fontWeight.semibold : TY.fontWeight.medium,
        color: active
          ? C.accent.DEFAULT
          : hovered
          ? C.text.primary
          : C.text.secondary,
        backgroundColor: active
          ? C.accent.bgSubtle
          : hovered
          ? C.card.DEFAULT
          : 'transparent',
        borderLeft: `2px solid ${active ? C.accent.DEFAULT : 'transparent'}`,
        transition: 'all 150ms ease',
        position: 'relative',
      }}
    >
      <Icon size={16} style={{ flexShrink: 0 }} />
      <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {label}
      </span>
      {badge > 0 && (
        <span
          style={{
            minWidth: SP[5],
            height: SP[5],
            backgroundColor: C.accent.DEFAULT,
            color: C.accent.on,
            fontSize: TY.fontSize['2xs'],
            fontWeight: TY.fontWeight.bold,
            borderRadius: '9999px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: `0 ${SP[1]}`,
          }}
        >
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </Link>
  )
}
