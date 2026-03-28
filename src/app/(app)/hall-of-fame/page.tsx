'use client'
import { useAppStore } from '@/store/app.store'
import { Avatar } from '@/components/shared/Avatar'
import { BADGES } from '@/types'
import { Trophy } from 'lucide-react'
import { EmptyState } from '@/components/shared/EmptyState'
import { formatDate } from '@/lib/utils'

export default function HallOfFamePage() {
  const { sprintResults, sprints, getUserById, userBadges } = useAppStore()

  const winners = sprintResults
    .filter(r => r.isWinner)
    .map(r => ({
      result: r,
      user: getUserById(r.userId),
      sprint: sprints.find(s => s.id === r.sprintId),
      badges: userBadges.filter(b => b.userId === r.userId && b.sprintId === r.sprintId),
    }))
    .filter(w => w.user && w.sprint)
    .reverse()

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Trophy size={22} className="text-amber-400" />
        <div>
          <h1 className="text-2xl font-bold text-white">Hall of Fame</h1>
          <p className="text-slate-400 text-sm">Sprint MVPs through history</p>
        </div>
      </div>

      {winners.length === 0 ? (
        <EmptyState
          icon="🏆"
          title="No winners yet"
          description="Complete your first sprint to see the Hall of Fame."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {winners.map(({ result, user, sprint, badges }) => (
            <div key={result.id} className="bg-[#13192a] border border-amber-500/20 rounded-2xl p-6 text-center relative overflow-hidden">
              <div className="absolute top-3 right-3 text-2xl">👑</div>
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <Avatar user={user!} size="xl" />
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center text-sm">
                    🏆
                  </div>
                </div>
              </div>
              <h3 className="text-lg font-bold text-white mb-0.5">{user!.name}</h3>
              <p className="text-xs text-slate-500 mb-3">{sprint!.name}</p>
              <div className="flex justify-center gap-4 mb-4 text-center">
                <div>
                  <p className="text-xl font-bold text-amber-400">{result.pointsScored}</p>
                  <p className="text-[10px] text-slate-500">points</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-green-400">{result.storiesCompleted}</p>
                  <p className="text-[10px] text-slate-500">stories</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-blue-400">{Math.round(result.onTimeRate * 100)}%</p>
                  <p className="text-[10px] text-slate-500">on time</p>
                </div>
              </div>
              {badges.length > 0 && (
                <div className="flex justify-center gap-1.5 flex-wrap">
                  {badges.map(b => {
                    const badge = BADGES.find(bd => bd.key === b.badgeKey)
                    return badge ? (
                      <span key={b.id} title={badge.name} className="text-base">{badge.icon}</span>
                    ) : null
                  })}
                </div>
              )}
              <p className="text-[10px] text-slate-600 mt-3">{formatDate(sprint!.endDate)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
