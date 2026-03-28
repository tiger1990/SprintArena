'use client'
import { useState } from 'react'
import { useAppStore } from '@/store/app.store'
import { useActiveSprint, useCurrentUser } from '@/hooks'
import { useTheme } from '@/hooks/useTheme'
import Link from 'next/link'

import { StatsCards }        from '@/components/dashboard/StatsCards'
import { ActiveSprintView }  from '@/components/dashboard/ActiveSprintView'
import { RecentActivity }    from '@/components/dashboard/RecentActivity'

export default function DashboardPage() {
  const { colors: C, typography: TY, spacing: SP, radius: R } = useTheme()
  const { sprint: activeSprint } = useActiveSprint()
  const { isAdmin } = useCurrentUser()

  return (
    <div style={{ padding: SP[6], display: 'flex', flexDirection: 'column', gap: SP[5] }}>

      {/* When no active sprint → show top-level stats */}
      {!activeSprint && <StatsCards />}

      {/* ── Main two-column grid ──────────────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 320px',
          gap: SP[5],
          alignItems: 'start',
        }}
        className="grid-cols-1 lg:grid-cols-[1fr_320px]"
      >
        {/* Left content */}
        <div>
          {activeSprint ? (
            <ActiveSprintView sprint={activeSprint} />
          ) : (
            <EmptyState isAdmin={isAdmin} C={C} TY={TY} SP={SP} R={R} />
          )}
        </div>

        {/* Right panel — always visible */}
        <aside>
          <RecentActivity />
        </aside>
      </div>
    </div>
  )
}

// ─── EmptyState ───────────────────────────────────────────────────────────────

function EmptyState({
  isAdmin, C, TY, SP, R,
}: {
  isAdmin: boolean; C: any; TY: any; SP: any; R: any
}) {
  return (
    <div
      style={{
        position: 'relative',
        backgroundColor: C.card.DEFAULT,
        border: `1px solid ${C.border.subtle}`,
        borderRadius: R['2xl'],
        padding: `${SP[16]} ${SP[10]}`,
        textAlign: 'center',
        overflow: 'hidden',
        minHeight: '340px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SP[4],
      }}
    >
      {/* Background orb */}
      <div style={{
        position: 'absolute', top: '20%', left: '50%',
        transform: 'translateX(-50%)',
        width: '200px', height: '200px',
        borderRadius: '9999px', backgroundColor: C.accent.bgSubtle,
        filter: 'blur(80px)', pointerEvents: 'none',
      }} />

      <div style={{ position: 'relative', zIndex: 1, fontSize: '3rem', lineHeight: 1 }}>🚀</div>

      <h2
        className="headline-font"
        style={{
          position: 'relative', zIndex: 1,
          fontSize: TY.fontSize['2xl'], fontWeight: TY.fontWeight.bold,
          color: C.text.primary, letterSpacing: TY.letterSpacing.tight,
          maxWidth: '320px', margin: 0,
        }}
      >
        Ready to start your first sprint?
      </h2>

      <p style={{
        position: 'relative', zIndex: 1,
        fontSize: TY.fontSize.sm, color: C.text.secondary,
        lineHeight: TY.lineHeight.relaxed, maxWidth: '360px', margin: 0,
      }}>
        Create a sprint, generate your backlog with AI, and start tracking progress.
        Your high-performance journey begins here.
      </p>

      {isAdmin && (
        <div style={{
          position: 'relative', zIndex: 1,
          display: 'flex', gap: SP[3], justifyContent: 'center', flexWrap: 'wrap',
        }}>
          <CTAButton href="/sprints/new" primary C={C} TY={TY} SP={SP} R={R}>
            Create Sprint
          </CTAButton>
          <CTAButton href="/ai-generator" primary={false} C={C} TY={TY} SP={SP} R={R}>
            Generate Backlog
          </CTAButton>
        </div>
      )}
    </div>
  )
}

// ─── CTAButton ────────────────────────────────────────────────────────────────

function CTAButton({
  href, primary, children, C, TY, SP, R,
}: {
  href: string; primary: boolean; children: React.ReactNode
  C: any; TY: any; SP: any; R: any
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <Link
      href={href}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        padding: `${SP[2.5]} ${SP[5]}`,
        borderRadius: R.lg,
        fontSize: TY.fontSize.sm, fontWeight: TY.fontWeight.semibold,
        textDecoration: 'none', transition: 'all 150ms ease',
        border: primary ? 'none' : `1px solid ${C.border.DEFAULT}`,
        backgroundColor: primary
          ? hovered ? C.accent.fixedDim : C.accent.DEFAULT
          : hovered ? C.card.hover : 'transparent',
        color: primary ? C.accent.on : C.text.secondary,
        cursor: 'pointer',
      }}
    >
      {children}
    </Link>
  )
}
