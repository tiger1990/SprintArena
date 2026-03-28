'use client'
import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { useAppStore } from '@/store/app.store'
import { useCurrentUser } from '@/hooks'
import { useTheme } from '@/hooks/useTheme'
import { Avatar } from '@/components/shared/Avatar'
import { Bell, Search } from 'lucide-react'
import Link from 'next/link'

const PAGE_LABELS: Record<string, string> = {
  '/dashboard':      'Dashboard',
  '/ai-generator':   'AI Backlog',
  '/board':          'Kanban Board',
  '/backlog':        'Backlog',
  '/backlog/proposed': 'Proposed',
  '/team':           'Team',
  '/hall-of-fame':   'Hall of Fame',
  '/notifications':  'Notifications',
  '/settings':       'Settings',
  '/profile':        'Profile',
}

export function TopBar() {
  const { colors, typography: TY, spacing: SP, radius: R } = useTheme()
  const pathname  = usePathname()
  const { currentUser, getUnreadCount } = useAppStore()
  const { user }  = useCurrentUser()
  const [search, setSearch] = useState('')

  // Resolve page label — exact match first, then prefix match
  const pageLabel =
    PAGE_LABELS[pathname] ??
    Object.entries(PAGE_LABELS).find(([key]) => pathname.startsWith(key + '/'))?.[1] ??
    'Dashboard'

  const unread = currentUser ? getUnreadCount(currentUser.id) : 0

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: SP[4],
        padding: `0 ${SP[6]}`,
        height: '60px',
        flexShrink: 0,
        borderBottom: `1px solid ${colors.border.subtle}`,
        backgroundColor: colors.page,
      }}
    >
      {/* Page title */}
      <h1
        className="headline-font"
        style={{
          fontSize: TY.fontSize['2xl'],
          fontWeight: TY.fontWeight.bold,
          color: colors.text.primary,
          letterSpacing: TY.letterSpacing.tight,
          whiteSpace: 'nowrap',
          marginRight: SP[4],
        }}
      >
        {pageLabel}
      </h1>

      {/* Search — grows to fill space */}
      <div style={{ flex: 1, maxWidth: '420px', position: 'relative' }}>
        <Search
          size={14}
          style={{
            position: 'absolute',
            left: SP[3],
            top: '50%',
            transform: 'translateY(-50%)',
            color: colors.text.disabled,
            pointerEvents: 'none',
          }}
        />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search stories..."
          style={{
            width: '100%',
            backgroundColor: colors.card.DEFAULT,
            border: `1px solid ${colors.border.subtle}`,
            borderRadius: R.lg,
            padding: `${SP[2]} ${SP[3]} ${SP[2]} ${SP[8]}`,
            fontSize: TY.fontSize.sm,
            color: colors.text.primary,
            outline: 'none',
            fontFamily: TY.fontFamily.body,
          }}
          onFocus={e  => { e.currentTarget.style.borderColor = colors.accent.DEFAULT }}
          onBlur={e   => { e.currentTarget.style.borderColor = colors.border.subtle }}
        />
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Bell */}
      <Link href="/notifications" style={{ position: 'relative', display: 'flex' }}>
        <Bell
          size={18}
          style={{ color: unread > 0 ? colors.accent.DEFAULT : colors.text.secondary, cursor: 'pointer' }}
        />
        {unread > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              width: '14px',
              height: '14px',
              backgroundColor: colors.accent.DEFAULT,
              color: colors.accent.on,
              fontSize: TY.fontSize['2xs'],
              fontWeight: TY.fontWeight.bold,
              borderRadius: '9999px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </Link>

      {/* User avatar */}
      {user && (
        <Link href="/profile">
          <Avatar user={user} size="sm" />
        </Link>
      )}
    </header>
  )
}
