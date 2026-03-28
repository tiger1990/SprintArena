'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCurrentUser } from '@/hooks'
import { useTheme } from '@/hooks/useTheme'
import { Sidebar }       from './Sidebar'
import { TopBar }        from './TopBar'
import { ErrorBoundary } from '@/components/shared/ErrorBoundary'

export function AppShell({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme()
  const { user: currentUser, isHydrated } = useCurrentUser()
  const router  = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (mounted && isHydrated && !currentUser) {
      router.replace('/login')
    }
  }, [currentUser, isHydrated, mounted, router])

  // Loading state
  if (!mounted || !isHydrated) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.page,
        }}
      >
        <div
          style={{
            width: '32px',
            height: '32px',
            border: `2px solid ${colors.accent.DEFAULT}`,
            borderTopColor: 'transparent',
            borderRadius: '9999px',
            animation: 'spin 0.7s linear infinite',
          }}
          className="animate-spin"
        />
      </div>
    )
  }

  if (!currentUser) return null

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        overflow: 'hidden',
        backgroundColor: colors.page,
      }}
    >
      {/* Left sidebar */}
      <Sidebar />

      {/* Right: topbar + scrollable content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <TopBar />

        <main
          style={{ flex: 1, overflowY: 'auto' }}
          className="pb-16 md:pb-0"
        >
          <ErrorBoundary context="Page">
            {children}
          </ErrorBoundary>
        </main>
      </div>

    </div>
  )
}
