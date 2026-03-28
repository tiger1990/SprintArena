'use client'
import { useParams } from 'next/navigation'
import { useAppStore } from '@/store/app.store'
import { Avatar } from '@/components/shared/Avatar'
import { BADGES } from '@/types'
import { User, Trophy, Target, Star } from 'lucide-react'
import { EmptyState } from '@/components/shared/EmptyState'
import { cn } from '@/lib/utils'

export default function ProfilePage() {
  const params = useParams()
  const { users, sprintResults, userBadges, sprints, stories, currentUser } = useAppStore()
  const user = users.find(u => u.id === params.id)

  if (!user) return <div className="p-6 text-slate-400">User not found.</div>

  const results = sprintResults.filter(r => r.userId === user.id)
  const badges = userBadges.filter(b => b.userId === user.id)
  const wins = results.filter(r => r.isWinner).length
  const totalStories = results.reduce((s, r) => s + r.storiesCompleted, 0)
  const totalPoints = results.reduce((s, r) => s + r.pointsScored, 0)
  const avgOnTime = results.length > 0
    ? Math.round(results.reduce((s, r) => s + r.onTimeRate, 0) / results.length * 100)
    : 0

  const earnedBadgeKeys = new Set(badges.map(b => b.badgeKey))

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Profile header */}
      <div className="bg-[#13192a] border border-slate-800 rounded-2xl p-6 mb-6 flex items-center gap-6 flex-wrap">
        <Avatar user={user} size="xl" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-white">{user.name}</h1>
            {user.id === currentUser?.id && (
              <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded">You</span>
            )}
          </div>
          <p className="text-slate-400 text-sm capitalize">{user.role}</p>
          {wins > 0 && (
            <p className="text-amber-400 text-sm mt-1">👑 {wins}x Sprint MVP</p>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Sprints Won', value: wins, icon: '👑', color: 'text-amber-400' },
          { label: 'Stories Done', value: totalStories, icon: '✅', color: 'text-green-400' },
          { label: 'Total Points', value: Math.round(totalPoints), icon: '⭐', color: 'text-indigo-400' },
          { label: 'On-Time Rate', value: `${avgOnTime}%`, icon: '⚡', color: 'text-blue-400' },
        ].map(stat => (
          <div key={stat.label} className="bg-[#13192a] border border-slate-800 rounded-xl p-4 text-center">
            <p className="text-2xl mb-1">{stat.icon}</p>
            <p className={cn('text-xl font-bold', stat.color)}>{stat.value}</p>
            <p className="text-[10px] text-slate-500">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Achievements */}
      <div className="bg-[#13192a] border border-slate-800 rounded-xl p-5 mb-6">
        <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Star size={14} className="text-amber-400" /> Achievements
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {BADGES.map(badge => {
            const earned = earnedBadgeKeys.has(badge.key)
            const earnedBadge = badges.find(b => b.badgeKey === badge.key)
            const sprint = earnedBadge ? sprints.find(s => s.id === earnedBadge.sprintId) : null
            return (
              <div
                key={badge.key}
                className={cn(
                  'p-3 rounded-xl text-center border transition-colors',
                  earned
                    ? 'bg-indigo-500/10 border-indigo-500/30'
                    : 'bg-slate-800/30 border-slate-800 opacity-40'
                )}
                title={badge.description}
              >
                <p className="text-2xl mb-1">{badge.icon}</p>
                <p className={cn('text-[11px] font-semibold', earned ? 'text-slate-200' : 'text-slate-500')}>
                  {badge.name}
                </p>
                {earned && sprint && (
                  <p className="text-[9px] text-slate-500">{sprint.name}</p>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Sprint history */}
      {results.length > 0 && (
        <div className="bg-[#13192a] border border-slate-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Trophy size={14} className="text-indigo-400" /> Sprint History
          </h2>
          <div className="space-y-3">
            {results.map(result => {
              const sprint = sprints.find(s => s.id === result.sprintId)
              return (
                <div key={result.id} className="flex items-center gap-3 py-2 border-b border-slate-800 last:border-0">
                  <span className="text-lg w-6 text-center">
                    {result.rank === 1 ? '🥇' : result.rank === 2 ? '🥈' : result.rank === 3 ? '🥉' : `#${result.rank}`}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-200">{sprint?.name || 'Sprint'}</p>
                    <p className="text-xs text-slate-500">{result.storiesCompleted} stories · {Math.round(result.onTimeRate * 100)}% on time</p>
                  </div>
                  <span className="text-sm font-bold text-indigo-400">{result.pointsScored}pts</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
