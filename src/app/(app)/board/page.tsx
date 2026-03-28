'use client'
import { useActiveSprint, useCurrentUser } from '@/hooks'
import { useTheme } from '@/hooks/useTheme'
import { KanbanBoard } from '@/components/board/KanbanBoard'
import { SprintHeader } from '@/components/board/SprintHeader'
import { ErrorBoundary } from '@/components/shared/ErrorBoundary'
import Link from 'next/link'

export default function BoardPage() {
  const { colors: C, typography: TY, spacing: SP, radius: R, transitions } = useTheme()
  const { sprint } = useActiveSprint()
  const { isAdmin } = useCurrentUser()

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>

      {/* ── Page header ────────────────────────────────────────────────── */}
      <div style={{ padding: `${SP[6]} ${SP[6]} ${SP[4]}`, flexShrink: 0 }}>
        <h1
          className="headline-font"
          style={{
            fontSize: TY.fontSize['3xl'],
            fontWeight: TY.fontWeight.bold,
            color: C.text.primary,
            letterSpacing: TY.letterSpacing.tight,
            lineHeight: TY.lineHeight.tight,
            margin: `0 0 ${SP[1]} 0`,
          }}
        >
          Active Sprint Board
        </h1>
        <p style={{ fontSize: TY.fontSize.sm, color: C.text.secondary, margin: 0 }}>
          Drag cards or use quick actions to move stories across columns.
        </p>
      </div>

      {sprint ? (
        <ErrorBoundary context="Kanban Board">
          <SprintHeader sprint={sprint} />
          <KanbanBoard sprint={sprint} />
        </ErrorBoundary>
      ) : (
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: SP[6],
        }}>
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: SP[4] }}>
            <div style={{
              width: SP[16], height: SP[16], borderRadius: '9999px',
              backgroundColor: C.accent.bgSubtle,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '2rem',
            }}>
              📋
            </div>
            <div>
              <p style={{ fontSize: TY.fontSize.lg, fontWeight: TY.fontWeight.semibold, color: C.text.primary, margin: `0 0 ${SP[1]} 0` }}>
                No active sprint
              </p>
              <p style={{ fontSize: TY.fontSize.sm, color: C.text.secondary, margin: 0 }}>
                Create a sprint and add stories to see the Kanban board.
              </p>
            </div>
            {isAdmin && (
              <Link
                href="/sprints/new"
                style={{
                  padding: `${SP[2.5]} ${SP[5]}`,
                  borderRadius: R.lg,
                  backgroundColor: C.accent.DEFAULT,
                  color: C.accent.on,
                  fontSize: TY.fontSize.sm,
                  fontWeight: TY.fontWeight.semibold,
                  textDecoration: 'none',
                  transition: `background-color ${transitions.fast}`,
                }}
              >
                Create Sprint
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
