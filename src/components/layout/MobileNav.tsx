'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAppStore } from '@/store/app.store'
import { useTheme } from '@/hooks/useTheme'
import { LayoutDashboard, Brain, Kanban, Trophy, Bell } from 'lucide-react'

const MOBILE_NAV = [
  { href: '/dashboard',    label: 'Dashboard', icon: LayoutDashboard },
  { href: '/ai-generator', label: 'AI',        icon: Brain           },
  { href: '/board',        label: 'Board',     icon: Kanban          },
  { href: '/hall-of-fame', label: 'Fame',      icon: Trophy          },
  { href: '/notifications',label: 'Alerts',    icon: Bell            },
]

export function MobileNav() {
  const { colors, typography: TY, spacing: SP } = useTheme()
  const pathname = usePathname()
  const { currentUser, getUnreadCount } = useAppStore()
  if (!currentUser) return null

  const unread = getUnreadCount(currentUser.id)
  const C = colors

  return (
    <nav
      className="md:hidden"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        backgroundColor: C.panel.left,
        borderTop: `1px solid ${C.border.subtle}`,
        display: 'flex',
      }}
    >
      {MOBILE_NAV.map(item => {
        const active = pathname === item.href || pathname.startsWith(item.href + '/')
        const Icon   = item.icon

        return (
          <Link
            key={item.href}
            href={item.href}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: SP[1],
              padding: `${SP[3]} 0`,
              fontSize: TY.fontSize['2xs'],
              fontWeight: TY.fontWeight.medium,
              color: active ? C.accent.DEFAULT : C.text.disabled,
              textDecoration: 'none',
              position: 'relative',
              transition: 'color 150ms ease',
            }}
          >
            <Icon size={20} />
            {item.label}
            {item.href === '/notifications' && unread > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: SP[2],
                  right: '20%',
                  width: SP[4],
                  height: SP[4],
                  backgroundColor: C.accent.DEFAULT,
                  color: C.accent.on,
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
        )
      })}
    </nav>
  )
}
