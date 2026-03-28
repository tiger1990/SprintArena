'use client'
import { useAppStore } from '@/store/app.store'
import { useTheme } from '@/hooks/useTheme'

interface Stat {
  label: string
  value: string | number
  sub: string
  valueColor: string
}

export function StatsCards() {
  const { colors, typography: TY, spacing: SP, radius: R } = useTheme()
  const { getActiveSprint, stories } = useAppStore()
  const sprint = getActiveSprint()

  const sprintStories = sprint ? stories.filter(s => s.sprintId === sprint.id) : []
  const done          = sprintStories.filter(s => s.status === 'done').length
  const inProgress    = sprintStories.filter(s => s.status === 'in_progress').length
  const todo          = sprintStories.filter(s => s.status === 'todo').length
  const total         = sprintStories.length
  const pct           = total > 0 ? Math.round((done / total) * 100) : 0

  const stats: Stat[] = [
    { label: 'STORIES DONE', value: done,        sub: `/ ${total} total`,        valueColor: colors.text.primary   },
    { label: 'IN PROGRESS',  value: inProgress,  sub: `${inProgress} active tasks`, valueColor: colors.text.primary },
    { label: 'TO DO',        value: todo,         sub: `${todo} in backlog`,       valueColor: colors.text.primary   },
    { label: 'COMPLETION',   value: `${pct}%`,    sub: 'current velocity',         valueColor: colors.accent.DEFAULT },
  ]

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: SP[4],
      }}
      className="grid-cols-2 md:grid-cols-4"
    >
      {stats.map(stat => (
        <StatCard key={stat.label} stat={stat} colors={colors} TY={TY} SP={SP} R={R} />
      ))}
    </div>
  )
}

function StatCard({
  stat, colors, TY, SP, R,
}: {
  stat: Stat; colors: any; TY: any; SP: any; R: any
}) {
  return (
    <div
      style={{
        backgroundColor: colors.card.DEFAULT,
        border: `1px solid ${colors.border.subtle}`,
        borderRadius: R.xl,
        padding: SP[5],
        display: 'flex',
        flexDirection: 'column',
        gap: SP[1],
      }}
    >
      {/* Metric name */}
      <p
        style={{
          fontSize: TY.fontSize['2xs'],
          fontWeight: TY.fontWeight.bold,
          color: colors.text.secondary,
          letterSpacing: TY.letterSpacing.wider,
          textTransform: 'uppercase',
        }}
      >
        {stat.label}
      </p>

      {/* Value */}
      <p
        style={{
          fontSize: TY.fontSize['4xl'],
          fontWeight: TY.fontWeight.bold,
          color: stat.valueColor,
          lineHeight: TY.lineHeight.none,
          fontFamily: TY.fontFamily.headline,
        }}
      >
        {stat.value}
      </p>

      {/* Sub-label */}
      <p
        style={{
          fontSize: TY.fontSize.xs,
          color: colors.text.secondary,
        }}
      >
        {stat.sub}
      </p>
    </div>
  )
}
