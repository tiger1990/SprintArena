'use client'
import { useParams } from 'next/navigation'
import { useAppStore } from '@/store/app.store'
import { useTheme } from '@/hooks/useTheme'
import { BADGES } from '@/types'
import type { User, SprintResult, Badge, Sprint } from '@/types'
import {
  Trophy, CheckCircle2, Zap, Target,
  MapPin, Share2, Pencil,
} from 'lucide-react'

export default function ProfilePage() {
  const { colors: C, typography: TY, spacing: SP, radius: R, transitions } = useTheme()
  const params = useParams()
  const { users, sprintResults, userBadges, sprints, currentUser } = useAppStore()

  const user = users.find(u => u.id === params.id)
  if (!user) {
    return (
      <div style={{ padding: SP[6], color: C.text.secondary, fontSize: TY.fontSize.sm }}>
        User not found.
      </div>
    )
  }

  const results      = sprintResults.filter(r => r.userId === user.id)
  const badges       = userBadges.filter(b => b.userId === user.id)
  const wins         = results.filter(r => r.isWinner).length
  const totalStories = results.reduce((s, r) => s + r.storiesCompleted, 0)
  const totalPoints  = results.reduce((s, r) => s + r.pointsScored, 0)
  const avgOnTime    = results.length > 0
    ? Math.round(results.reduce((s, r) => s + r.onTimeRate, 0) / results.length * 100)
    : 0
  const earnedBadgeKeys = new Set(badges.map(b => b.badgeKey))
  const isOwnProfile = user.id === currentUser?.id

  return (
    <div style={{ padding: SP[6] }}>
      <HeroCard
        user={user}
        wins={wins}
        isOwnProfile={isOwnProfile}
        C={C} TY={TY} SP={SP} R={R} transitions={transitions}
      />

      <div style={{ display: 'flex', gap: SP[4], flexWrap: 'wrap', marginBottom: SP[5] }}>
        <StatCard
          label="Sprints Won"
          value={wins}
          subLabel={`${wins} / ${results.length} total`}
          icon={Trophy}
          iconColor={C.warning}
          C={C} TY={TY} SP={SP} R={R}
        />
        <StatCard
          label="Stories Done"
          value={totalStories}
          subLabel="Completed"
          icon={CheckCircle2}
          iconColor={C.success}
          C={C} TY={TY} SP={SP} R={R}
        />
        <StatCard
          label="Total Points"
          value={Math.round(totalPoints)}
          subLabel="XP Gained"
          icon={Zap}
          iconColor={C.accent.DEFAULT}
          C={C} TY={TY} SP={SP} R={R}
        />
        <StatCard
          label="On-Time Rate"
          value={`${avgOnTime}%`}
          subLabel="Precision"
          icon={Target}
          iconColor={C.palette.primaryFixedDim}
          C={C} TY={TY} SP={SP} R={R}
        />
      </div>

      <AchievementsSection
        badges={BADGES}
        earnedBadgeKeys={earnedBadgeKeys}
        sprints={sprints}
        userBadges={badges}
        C={C} TY={TY} SP={SP} R={R}
      />

      <SprintHistorySection
        results={results}
        sprints={sprints}
        C={C} TY={TY} SP={SP} R={R}
      />
    </div>
  )
}

// ─── Hero Card ────────────────────────────────────────────────────────────────

function HeroCard({
  user, isOwnProfile, C, TY, SP, R, transitions,
}: {
  user: User
  wins: number
  isOwnProfile: boolean
  C: any; TY: any; SP: any; R: any; transitions: any
}) {
  const roleLabel = user.role === 'admin' ? 'System Administrator' : 'Assignee'

  return (
    <div style={{
      backgroundColor: C.card.DEFAULT,
      border: `1px solid ${C.border.DEFAULT}`,
      borderRadius: R['2xl'],
      padding: SP[6],
      marginBottom: SP[5],
      display: 'flex',
      gap: SP[6],
      alignItems: 'flex-start',
      flexWrap: 'wrap',
    }}>
      {/* Rectangular hero avatar */}
      {user.photoUrl ? (
        <img
          src={user.photoUrl}
          alt={user.name}
          style={{
            width: '88px',
            height: '104px',
            borderRadius: R['2xl'],
            objectFit: 'cover',
            flexShrink: 0,
          }}
        />
      ) : (
        <div style={{
          width: '88px',
          height: '104px',
          borderRadius: R['2xl'],
          backgroundColor: user.color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: TY.fontSize['3xl'],
          fontWeight: TY.fontWeight.bold,
          color: '#fff',
          flexShrink: 0,
          fontFamily: TY.fontFamily.headline,
        }}>
          {user.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
        </div>
      )}

      {/* Identity block — fills remaining space */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Role label */}
        <p style={{
          fontSize: TY.fontSize['2xs'],
          fontWeight: TY.fontWeight.bold,
          letterSpacing: TY.letterSpacing.wider,
          textTransform: 'uppercase' as const,
          color: C.accent.DEFAULT,
          margin: `0 0 ${SP[1.5]} 0`,
        }}>
          {roleLabel}
        </p>

        {/* Name + action buttons row */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: SP[4],
          flexWrap: 'wrap' as const,
          marginBottom: SP[3],
        }}>
          <h1 className="headline-font" style={{
            fontSize: TY.fontSize['3xl'],
            fontWeight: TY.fontWeight.bold,
            color: C.text.primary,
            letterSpacing: TY.letterSpacing.tight,
            lineHeight: TY.lineHeight.tight,
            margin: 0,
          }}>
            {user.name}
          </h1>

          {/* Action buttons — right-aligned, own profile only */}
          {isOwnProfile && (
            <div style={{ display: 'flex', gap: SP[3], flexShrink: 0 }}>
              <button style={{
                display: 'flex', alignItems: 'center', gap: SP[2],
                padding: `${SP[2]} ${SP[4]}`,
                borderRadius: R.lg,
                border: `1px solid ${C.border.strong}`,
                backgroundColor: 'transparent',
                color: C.text.primary,
                fontSize: TY.fontSize.sm,
                fontWeight: TY.fontWeight.semibold,
                cursor: 'pointer',
                transition: `all ${transitions.fast}`,
              }}>
                <Pencil size={14} />
                Edit Profile
              </button>

              <button style={{
                display: 'flex', alignItems: 'center', gap: SP[2],
                padding: `${SP[2]} ${SP[4]}`,
                borderRadius: R.lg,
                border: `1px solid ${C.accent.DEFAULT}`,
                backgroundColor: C.accent.bgSubtle,
                color: C.accent.DEFAULT,
                fontSize: TY.fontSize.sm,
                fontWeight: TY.fontWeight.semibold,
                cursor: 'pointer',
                transition: `all ${transitions.fast}`,
              }}>
                <Share2 size={14} />
                Share Stats
              </button>
            </div>
          )}
        </div>

        {/* Status + location row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: SP[3],
          flexWrap: 'wrap' as const,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: SP[1.5] }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: R.full,
              backgroundColor: C.success,
              boxShadow: `0 0 6px ${C.success}`,
            }} />
            <span style={{ fontSize: TY.fontSize.xs, color: C.text.secondary }}>Online</span>
          </div>

          <span style={{ color: C.border.strong, fontSize: TY.fontSize.xs }}>·</span>

          <div style={{ display: 'flex', alignItems: 'center', gap: SP[1] }}>
            <MapPin size={12} color={C.text.secondary} />
            <span style={{ fontSize: TY.fontSize.xs, color: C.text.secondary }}>
              {user.timezone}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  label, value, subLabel, icon: Icon, iconColor,
  C, TY, SP, R,
}: {
  label: string
  value: string | number
  subLabel: string
  icon: React.ElementType
  iconColor: string
  C: any; TY: any; SP: any; R: any
}) {
  return (
    <div style={{
      flex: '1 1 160px',
      backgroundColor: C.card.DEFAULT,
      border: `1px solid ${C.border.DEFAULT}`,
      borderRadius: R.xl,
      padding: SP[5],
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: SP[3],
      }}>
        <span style={{
          fontSize: TY.fontSize['2xs'],
          fontWeight: TY.fontWeight.bold,
          letterSpacing: TY.letterSpacing.wider,
          textTransform: 'uppercase' as const,
          color: C.text.disabled,
        }}>
          {label}
        </span>
        <Icon size={14} color={iconColor} />
      </div>

      <p className="headline-font" style={{
        fontSize: TY.fontSize['2xl'],
        fontWeight: TY.fontWeight.bold,
        color: C.text.primary,
        margin: `0 0 ${SP[1]} 0`,
        lineHeight: 1,
      }}>
        {value}
      </p>

      <p style={{
        fontSize: TY.fontSize['2xs'],
        color: C.text.disabled,
        margin: 0,
      }}>
        {subLabel}
      </p>
    </div>
  )
}

// ─── Achievement Card ─────────────────────────────────────────────────────────

function AchievementCard({
  badge, earned, sprintName,
  C, TY, SP, R,
}: {
  badge: Badge
  earned: boolean
  sprintName?: string
  C: any; TY: any; SP: any; R: any
}) {
  return (
    <div style={{
      padding: SP[4],
      borderRadius: R.xl,
      border: `1px solid ${earned ? `${C.accent.DEFAULT}44` : C.border.DEFAULT}`,
      backgroundColor: earned ? C.accent.bgSubtle : 'transparent',
      opacity: earned ? 1 : 0.35,
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      textAlign: 'center' as const,
      gap: SP[2],
    }}>
      <div style={{
        width: '44px',
        height: '44px',
        borderRadius: R.full,
        backgroundColor: C.card.sunken,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '20px',
        filter: earned ? 'none' : 'grayscale(1)',
      }}>
        {badge.icon}
      </div>

      <p style={{
        fontSize: TY.fontSize.xs,
        fontWeight: TY.fontWeight.semibold,
        color: C.text.primary,
        margin: 0,
        lineHeight: TY.lineHeight.snug,
      }}>
        {badge.name}
      </p>

      <p style={{
        fontSize: TY.fontSize['2xs'],
        color: C.text.secondary,
        margin: 0,
        lineHeight: TY.lineHeight.normal,
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical' as const,
        overflow: 'hidden',
      }}>
        {badge.description}
      </p>

      {earned && sprintName && (
        <p style={{
          fontSize: TY.fontSize['2xs'],
          color: C.text.disabled,
          margin: 0,
        }}>
          {sprintName}
        </p>
      )}
    </div>
  )
}

// ─── Achievements Section ─────────────────────────────────────────────────────

function AchievementsSection({
  badges, earnedBadgeKeys, sprints, userBadges,
  C, TY, SP, R,
}: {
  badges: Badge[]
  earnedBadgeKeys: Set<string>
  sprints: Sprint[]
  userBadges: any[]
  C: any; TY: any; SP: any; R: any
}) {
  return (
    <div style={{
      backgroundColor: C.card.DEFAULT,
      border: `1px solid ${C.border.DEFAULT}`,
      borderRadius: R['2xl'],
      padding: SP[5],
      marginBottom: SP[5],
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: SP[4],
      }}>
        <h2 style={{
          fontSize: TY.fontSize.base,
          fontWeight: TY.fontWeight.semibold,
          color: C.text.primary,
          margin: 0,
        }}>
          Achievements
        </h2>
        <span style={{
          fontSize: TY.fontSize.xs,
          color: C.accent.DEFAULT,
          cursor: 'pointer',
        }}>
          View All →
        </span>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: SP[3],
      }}>
        {badges.map(badge => {
          const earned = earnedBadgeKeys.has(badge.key)
          const earnedBadge = userBadges.find((b: any) => b.badgeKey === badge.key)
          const sprint = earnedBadge ? sprints.find((s: Sprint) => s.id === earnedBadge.sprintId) : null
          return (
            <AchievementCard
              key={badge.key}
              badge={badge}
              earned={earned}
              sprintName={sprint?.name}
              C={C} TY={TY} SP={SP} R={R}
            />
          )
        })}
      </div>
    </div>
  )
}

// ─── History Row ──────────────────────────────────────────────────────────────

function HistoryRow({
  result, sprintName, isLast,
  C, TY, SP, R,
}: {
  result: SprintResult
  sprintName: string
  isLast: boolean
  C: any; TY: any; SP: any; R: any
}) {
  const medal =
    result.rank === 1 ? '🥇'
    : result.rank === 2 ? '🥈'
    : result.rank === 3 ? '🥉'
    : null

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: SP[4],
      padding: `${SP[3]} 0`,
      borderBottom: isLast ? 'none' : `1px solid ${C.border.subtle}`,
    }}>
      <div style={{
        width: '32px',
        textAlign: 'center' as const,
        fontSize: medal ? '18px' : TY.fontSize.sm,
        fontWeight: TY.fontWeight.bold,
        color: medal ? undefined : C.text.disabled,
        flexShrink: 0,
      }}>
        {medal ?? `#${result.rank}`}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontSize: TY.fontSize.sm,
          color: C.text.primary,
          margin: `0 0 ${SP[0.5]} 0`,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap' as const,
        }}>
          {sprintName}
        </p>
        <p style={{
          fontSize: TY.fontSize.xs,
          color: C.text.disabled,
          margin: 0,
        }}>
          {result.storiesCompleted} stories · {Math.round(result.onTimeRate * 100)}% on time
        </p>
      </div>

      <div style={{
        padding: `${SP[1]} ${SP[3]}`,
        borderRadius: R.md,
        backgroundColor: C.accent.bgSubtle,
        color: C.accent.DEFAULT,
        fontSize: TY.fontSize.sm,
        fontWeight: TY.fontWeight.bold,
        flexShrink: 0,
      }}>
        {result.pointsScored}pts
      </div>
    </div>
  )
}

// ─── Sprint History Section ───────────────────────────────────────────────────

function SprintHistorySection({
  results, sprints,
  C, TY, SP, R,
}: {
  results: SprintResult[]
  sprints: Sprint[]
  C: any; TY: any; SP: any; R: any
}) {
  if (results.length === 0) return null

  return (
    <div style={{
      backgroundColor: C.card.DEFAULT,
      border: `1px solid ${C.border.DEFAULT}`,
      borderRadius: R['2xl'],
      padding: SP[5],
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: SP[2],
        marginBottom: SP[4],
      }}>
        <Trophy size={14} color={C.accent.DEFAULT} />
        <h2 style={{
          fontSize: TY.fontSize.base,
          fontWeight: TY.fontWeight.semibold,
          color: C.text.primary,
          margin: 0,
        }}>
          Sprint History
        </h2>
      </div>

      <div>
        {results.map((result, i) => {
          const sprint = sprints.find(s => s.id === result.sprintId)
          return (
            <HistoryRow
              key={result.id}
              result={result}
              sprintName={sprint?.name ?? 'Sprint'}
              isLast={i === results.length - 1}
              C={C} TY={TY} SP={SP} R={R}
            />
          )
        })}
      </div>
    </div>
  )
}
