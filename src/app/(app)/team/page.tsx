'use client'
import { useState } from 'react'
import type { User } from '@/types'
import { useAppStore } from '@/store/app.store'
import { useTheme } from '@/hooks/useTheme'
import { useCurrentUser, useActiveSprint } from '@/hooks'
import { Avatar } from '@/components/shared/Avatar'
import { AddMemberDialog } from '@/components/team/AddMemberDialog'
import { Copy, MoreHorizontal, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { sprintProgress } from '@/lib/utils'

export default function TeamPage() {
  const { colors: C, typography: TY, spacing: SP, radius: R, transitions } = useTheme()
  const { users, currentUser, workspace, stories } = useAppStore()
  const { isAdmin } = useCurrentUser()
  const { sprint } = useActiveSprint()
  const [addOpen, setAddOpen] = useState(false)

  const copyInviteCode = () => {
    if (workspace) {
      navigator.clipboard.writeText(workspace.inviteCode)
      toast.success('Invite code copied!')
    }
  }

  // Squad Velocity derivations
  const sprintStories = sprint ? stories.filter(s => s.sprintId === sprint.id) : []
  const tasksDone    = sprintStories.filter(s => s.status === 'done').length
  const activePRs    = sprintStories.filter(s => s.status === 'in_progress').length
  const timeProgress = sprint ? sprintProgress(sprint.startDate, sprint.endDate) : 0

  return (
    <div style={{ padding: SP[6] }}>

      {/* ── Page header ──────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        marginBottom: SP[6], flexWrap: 'wrap', gap: SP[4],
      }}>
        <div>
          <p style={{
            fontSize: TY.fontSize['2xs'], fontWeight: TY.fontWeight.bold,
            color: C.accent.DEFAULT, letterSpacing: TY.letterSpacing.wider,
            textTransform: 'uppercase', margin: `0 0 ${SP[1.5]} 0`,
          }}>
            Workspace
          </p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: SP[3], marginBottom: SP[2] }}>
            <h1 className="headline-font" style={{
              fontSize: TY.fontSize['4xl'], fontWeight: TY.fontWeight.bold,
              color: C.text.primary, letterSpacing: TY.letterSpacing.tight,
              lineHeight: TY.lineHeight.tight, margin: 0,
            }}>
              Team
            </h1>
            <span style={{
              fontSize: TY.fontSize['2xl'], fontWeight: TY.fontWeight.semibold,
              color: C.text.secondary,
            }}>
              {users.length} members
            </span>
          </div>
          <p style={{ fontSize: TY.fontSize.sm, color: C.text.secondary, margin: 0, maxWidth: '440px' }}>
            Manage your high-performance squad and invite new collaborators to the current sprint cycle.
          </p>
        </div>

        {isAdmin && (
          <AddMemberBtn
            onClick={() => setAddOpen(true)}
            C={C} TY={TY} SP={SP} R={R} transitions={transitions}
          />
        )}
      </div>

      {/* ── Two-column body ─────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: SP[5], alignItems: 'flex-start', flexWrap: 'wrap' }}>

        {/* Left: Active Members */}
        <div style={{ flex: '3 1 380px', minWidth: '300px' }}>
          <ActiveMembersCard
            users={users}
            currentUser={currentUser}
            C={C} TY={TY} SP={SP} R={R} transitions={transitions}
          />
        </div>

        {/* Right: Invite Code + Squad Velocity */}
        <div style={{ flex: '2 1 240px', minWidth: '220px', display: 'flex', flexDirection: 'column', gap: SP[4] }}>
          {workspace && isAdmin && (
            <InviteCodeCard
              inviteCode={workspace.inviteCode}
              onCopy={copyInviteCode}
              C={C} TY={TY} SP={SP} R={R} transitions={transitions}
            />
          )}
          <SquadVelocityCard
            timeProgress={timeProgress}
            tasksDone={tasksDone}
            activePRs={activePRs}
            hasSprint={!!sprint}
            sprintName={sprint?.name}
            C={C} TY={TY} SP={SP} R={R}
          />
        </div>
      </div>

      <AddMemberDialog open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  )
}

// ─── Add Member Button ────────────────────────────────────────────────────────

function AddMemberBtn({ onClick, C, TY, SP, R, transitions }: any) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: SP[2],
        padding: `${SP[2.5]} ${SP[4]}`,
        borderRadius: R.lg,
        border: `1px solid ${hovered ? C.accent.DEFAULT : C.accent.dim}`,
        backgroundColor: hovered ? C.accent.DEFAULT : C.accent.bgSubtle,
        color: hovered ? C.accent.on : C.accent.DEFAULT,
        fontSize: TY.fontSize.sm, fontWeight: TY.fontWeight.semibold,
        cursor: 'pointer',
        transition: `all ${transitions.fast}`,
        flexShrink: 0,
      }}
    >
      <UserPlus size={15} />
      Add Member
    </button>
  )
}

// ─── Active Members Card ──────────────────────────────────────────────────────

function ActiveMembersCard({ users, currentUser, C, TY, SP, R, transitions }: {
  users: User[]; currentUser: User | null; C: any; TY: any; SP: any; R: any; transitions: any
}) {
  return (
    <div style={{
      backgroundColor: C.card.DEFAULT,
      border: `1px solid ${C.border.DEFAULT}`,
      borderRadius: R['2xl'],
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: `${SP[4]} ${SP[5]}`,
        borderBottom: `1px solid ${C.border.subtle}`,
      }}>
        <h2 style={{
          fontSize: TY.fontSize.base, fontWeight: TY.fontWeight.semibold,
          color: C.text.primary, margin: 0,
        }}>
          Active Members
        </h2>
        <button style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: SP[1], border: 'none',
          backgroundColor: 'transparent', color: C.text.disabled,
          cursor: 'pointer', borderRadius: R.sm,
        }}>
          <MoreHorizontal size={16} />
        </button>
      </div>

      {/* Rows */}
      <div>
        {users.map((user, i) => (
          <MemberRow
            key={user.id}
            user={user}
            isCurrentUser={user.id === currentUser?.id}
            isLast={i === users.length - 1}
            C={C} TY={TY} SP={SP} R={R} transitions={transitions}
          />
        ))}
      </div>
    </div>
  )
}

// ─── Member Row ───────────────────────────────────────────────────────────────

function MemberRow({ user, isCurrentUser, isLast, C, TY, SP, R, transitions }: {
  user: User; isCurrentUser: boolean; isLast: boolean; C: any; TY: any; SP: any; R: any; transitions: any
}) {
  const [hovered, setHovered] = useState(false)
  const isAdmin = user.role === 'admin'

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: SP[4],
        padding: `${SP[3.5]} ${SP[5]}`,
        borderBottom: isLast ? 'none' : `1px solid ${C.border.subtle}`,
        backgroundColor: hovered ? C.card.hover : 'transparent',
        transition: `background-color ${transitions.fast}`,
      }}
    >
      <Avatar user={user} size="md" />

      {/* Name + email */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: SP[2], marginBottom: '2px' }}>
          <span style={{
            fontSize: TY.fontSize.sm, fontWeight: TY.fontWeight.semibold,
            color: C.text.primary,
          }}>
            {user.name}
          </span>
          {isCurrentUser && (
            <span style={{
              fontSize: TY.fontSize['2xs'], color: C.text.disabled,
              backgroundColor: C.card.sunken,
              padding: `1px ${SP[1.5]}`,
              borderRadius: R.sm,
              fontWeight: TY.fontWeight.medium,
            }}>
              You
            </span>
          )}
        </div>
        <p style={{
          fontSize: TY.fontSize.xs, color: C.text.disabled, margin: 0,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {user.email
            ? user.email
            : `${user.name.toLowerCase().replace(/\s+/g, '.')}@sprintarena.ai`
          }
        </p>
      </div>

      {/* Role chip */}
      <span style={{
        fontSize: TY.fontSize['2xs'], fontWeight: TY.fontWeight.bold,
        letterSpacing: TY.letterSpacing.wider, textTransform: 'uppercase',
        padding: `${SP[1]} ${SP[2.5]}`,
        borderRadius: R.md,
        border: `1px solid ${isAdmin ? `${C.accent.DEFAULT}44` : C.border.DEFAULT}`,
        color: isAdmin ? C.accent.DEFAULT : C.text.secondary,
        backgroundColor: isAdmin ? C.accent.bgSubtle : 'transparent',
        flexShrink: 0,
      }}>
        {user.role}
      </span>

      {/* Status dot */}
      <div style={{
        width: '10px', height: '10px', borderRadius: '9999px',
        backgroundColor: user.color, flexShrink: 0,
        boxShadow: `0 0 6px ${user.color}80`,
      }} />
    </div>
  )
}

// ─── Invite Code Card ─────────────────────────────────────────────────────────

function InviteCodeCard({ inviteCode, onCopy, C, TY, SP, R, transitions }: any) {
  const [hovered, setHovered] = useState(false)

  return (
    <div style={{
      backgroundColor: C.card.DEFAULT,
      border: `1px solid ${C.border.DEFAULT}`,
      borderRadius: R['2xl'],
      padding: SP[5],
    }}>
      {/* Title + icon */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: SP[2] }}>
        <h3 style={{
          fontSize: TY.fontSize.sm, fontWeight: TY.fontWeight.semibold,
          color: C.text.primary, margin: 0,
        }}>
          Invite code
        </h3>
        <div style={{
          width: '28px', height: '28px', borderRadius: R.md,
          backgroundColor: C.accent.bgSubtle,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '14px',
        }}>
          ☁️
        </div>
      </div>

      <p style={{
        fontSize: TY.fontSize.xs, color: C.text.secondary, margin: `0 0 ${SP[4]} 0`,
        lineHeight: TY.lineHeight.relaxed,
      }}>
        Share this unique code with your team to grant instant access.
      </p>

      {/* Code block */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: C.card.sunken,
        border: `1px solid ${C.border.subtle}`,
        borderRadius: R.lg,
        padding: `${SP[3]} ${SP[4]}`,
        marginBottom: SP[3],
        gap: SP[3],
      }}>
        <span style={{
          fontFamily: 'var(--font-geist-mono)',
          fontSize: TY.fontSize.xl, fontWeight: TY.fontWeight.bold,
          color: C.text.primary, letterSpacing: '0.18em',
        }}>
          {inviteCode}
        </span>
        <button
          onClick={onCopy}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          style={{
            display: 'flex', alignItems: 'center', gap: SP[1.5],
            padding: `${SP[1.5]} ${SP[3]}`,
            borderRadius: R.md,
            border: `1px solid ${hovered ? C.accent.DEFAULT : C.border.DEFAULT}`,
            backgroundColor: hovered ? C.accent.bgSubtle : 'transparent',
            color: hovered ? C.accent.DEFAULT : C.text.secondary,
            fontSize: TY.fontSize.xs, fontWeight: TY.fontWeight.semibold,
            cursor: 'pointer',
            transition: `all ${transitions.fast}`,
            flexShrink: 0,
          }}
        >
          <Copy size={12} />
          Copy Code
        </button>
      </div>

      <p style={{
        fontSize: TY.fontSize['2xs'], color: C.text.disabled,
        fontWeight: TY.fontWeight.bold,
        letterSpacing: TY.letterSpacing.wider,
        textTransform: 'uppercase', margin: 0,
      }}>
        Expires in 24 hours
      </p>
    </div>
  )
}

// ─── Squad Velocity Card ──────────────────────────────────────────────────────

function SquadVelocityCard({ timeProgress, tasksDone, activePRs, hasSprint, sprintName, C, TY, SP, R }: {
  timeProgress: number; tasksDone: number; activePRs: number;
  hasSprint: boolean; sprintName?: string; C: any; TY: any; SP: any; R: any
}) {
  return (
    <div style={{
      backgroundColor: C.card.DEFAULT,
      border: `1px solid ${C.border.DEFAULT}`,
      borderRadius: R['2xl'],
      padding: SP[5],
    }}>
      <h3 style={{
        fontSize: TY.fontSize.sm, fontWeight: TY.fontWeight.semibold,
        color: C.text.primary, margin: `0 0 ${SP[4]} 0`,
      }}>
        Squad Velocity
      </h3>

      {hasSprint ? (
        <>
          {/* Progress row */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: SP[2],
          }}>
            <span style={{ fontSize: TY.fontSize.xs, color: C.text.secondary }}>
              Active Sprint Progress
            </span>
            <span style={{
              fontSize: TY.fontSize.sm, fontWeight: TY.fontWeight.bold,
              color: C.accent.DEFAULT,
            }}>
              {timeProgress}%
            </span>
          </div>

          {/* Bar */}
          <div style={{
            height: '6px', backgroundColor: C.card.sunken,
            borderRadius: R.full, overflow: 'hidden',
            marginBottom: SP[5],
          }}>
            <div style={{
              height: '100%', width: `${timeProgress}%`,
              background: `linear-gradient(90deg, ${C.accent.dim}, ${C.accent.DEFAULT})`,
              borderRadius: R.full,
              transition: 'width 0.6s ease',
            }} />
          </div>

          {/* Stat pair */}
          <div style={{ display: 'flex', gap: SP[6] }}>
            <div>
              <p style={{
                fontSize: TY.fontSize['2xs'], color: C.text.disabled,
                fontWeight: TY.fontWeight.bold,
                letterSpacing: TY.letterSpacing.wider,
                textTransform: 'uppercase', margin: `0 0 ${SP[1]} 0`,
              }}>
                Tasks Done
              </p>
              <p className="headline-font" style={{
                fontSize: TY.fontSize['2xl'], fontWeight: TY.fontWeight.bold,
                color: C.text.primary, margin: 0, lineHeight: 1,
              }}>
                {tasksDone}
              </p>
            </div>
            <div>
              <p style={{
                fontSize: TY.fontSize['2xs'], color: C.text.disabled,
                fontWeight: TY.fontWeight.bold,
                letterSpacing: TY.letterSpacing.wider,
                textTransform: 'uppercase', margin: `0 0 ${SP[1]} 0`,
              }}>
                Active PRs
              </p>
              <p className="headline-font" style={{
                fontSize: TY.fontSize['2xl'], fontWeight: TY.fontWeight.bold,
                color: C.text.primary, margin: 0, lineHeight: 1,
              }}>
                {activePRs}
              </p>
            </div>
          </div>

          {sprintName && (
            <p style={{
              fontSize: TY.fontSize['2xs'], color: C.text.disabled,
              fontWeight: TY.fontWeight.medium,
              marginTop: SP[4], marginBottom: 0,
              paddingTop: SP[3],
              borderTop: `1px solid ${C.border.subtle}`,
            }}>
              {sprintName} · Active
            </p>
          )}
        </>
      ) : (
        <div style={{
          padding: `${SP[4]} 0`,
          textAlign: 'center',
        }}>
          <p style={{ fontSize: TY.fontSize.sm, color: C.text.disabled, margin: 0 }}>
            No active sprint
          </p>
        </div>
      )}
    </div>
  )
}
