'use client'
import { useAppStore } from '@/store/app.store'
import { Avatar } from '@/components/shared/Avatar'
import { Trophy } from 'lucide-react'
import Link from 'next/link'

export function HallOfFamePreview() {
  const { sprintResults, sprints, getUserById } = useAppStore()
  const winners = sprintResults
    .filter(r => r.isWinner)
    .slice(0, 3)
    .map(r => ({
      result: r,
      user: getUserById(r.userId),
      sprint: sprints.find(s => s.id === r.sprintId),
    }))
    .filter(w => w.user && w.sprint)

  if (winners.length === 0) return null

  return (
    <div className="bg-[#13192a] border border-slate-800 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Trophy size={16} className="text-amber-400" />
          <h2 className="text-sm font-semibold text-white">Hall of Fame</h2>
        </div>
        <Link href="/hall-of-fame" className="text-[11px] text-indigo-400 hover:text-indigo-300">All →</Link>
      </div>
      <div className="space-y-3">
        {winners.map(({ result, user, sprint }) => (
          <div key={result.id} className="flex items-center gap-3">
            <Avatar user={user!} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-slate-200 truncate">{user!.name}</p>
              <p className="text-[10px] text-slate-500">{sprint!.name} · {result.pointsScored}pts</p>
            </div>
            <span className="text-base">👑</span>
          </div>
        ))}
      </div>
    </div>
  )
}
