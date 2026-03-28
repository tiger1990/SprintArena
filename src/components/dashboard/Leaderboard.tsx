'use client'
import { useAppStore } from '@/store/app.store'
import { Avatar } from '@/components/shared/Avatar'
import { Trophy } from 'lucide-react'

const RANK_MEDALS = ['🥇', '🥈', '🥉']

export function Leaderboard() {
  const { getActiveSprint, stories, users } = useAppStore()
  const sprint = getActiveSprint()

  if (!sprint) return null

  const sprintStories = stories.filter(s => s.sprintId === sprint.id)

  const liveScores = users
    .filter(u => u.role === 'assignee' || !useAppStore.getState().workspace?.settings.adminExcludedFromScoring)
    .map(user => {
      const userStories = sprintStories.filter(s => s.assigneeId === user.id)
      const done = userStories.filter(s => s.status === 'done')
      const points = done.reduce((sum, s) => sum + s.storyPoints, 0)
      return { user, points, done: done.length, total: userStories.length }
    })
    .filter(s => s.total > 0)
    .sort((a, b) => b.points - a.points)

  if (liveScores.length === 0) return null

  const maxPoints = liveScores[0]?.points || 1

  return (
    <div className="bg-[#12151f] border border-slate-800/80 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800/60">
        <div className="flex items-center gap-2">
          <Trophy size={14} className="text-amber-400" />
          <h2 className="text-sm font-semibold text-white">Sprint Leaderboard</h2>
        </div>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-500/10 border border-green-500/20 rounded-full text-[9px] font-bold text-green-400">
          <span className="w-1 h-1 bg-green-400 rounded-full animate-pulse" />
          LIVE
        </span>
      </div>

      {/* Table rows */}
      <div className="divide-y divide-slate-800/40">
        {liveScores.map((entry, i) => {
          const pct = maxPoints > 0 ? Math.round((entry.points / maxPoints) * 100) : 0
          return (
            <div key={entry.user.id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-800/20 transition-colors">
              {/* Rank */}
              <span className="text-sm w-5 text-center flex-shrink-0">
                {i < 3 ? RANK_MEDALS[i] : <span className="text-xs text-slate-600 font-bold">{i + 1}</span>}
              </span>

              <Avatar user={entry.user} size="xs" />

              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-200 truncate leading-none">{entry.user.name}</p>
                {/* Progress bar */}
                <div className="flex items-center gap-2 mt-1.5">
                  <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-[9px] text-slate-600 flex-shrink-0">{entry.done}/{entry.total}</span>
                </div>
              </div>

              {/* Points chip */}
              <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full flex-shrink-0">
                {entry.points}pt
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
