'use client'
import { useParams } from 'next/navigation'
import { useAppStore } from '@/store/app.store'
import { Avatar } from '@/components/shared/Avatar'
import { BADGES } from '@/types'
import { Button } from '@/components/ui/button'
import { Trophy, ArrowRight, Share2 } from 'lucide-react'
import Link from 'next/link'
import { EmptyState } from '@/components/shared/EmptyState'
import { cn } from '@/lib/utils'
import { useEffect, useState } from 'react'

export default function WinnerPage() {
  const params = useParams()
  const { sprints, sprintResults, getUserById, userBadges } = useAppStore()
  const [showConfetti, setShowConfetti] = useState(false)

  const sprint = sprints.find(s => s.id === params.id)
  const results = sprintResults.filter(r => r.sprintId === params.id).sort((a, b) => a.rank - b.rank)
  const winner = results.find(r => r.isWinner)
  const winnerUser = winner ? getUserById(winner.userId) : null
  const winnerBadges = winner ? userBadges.filter(b => b.userId === winner.userId && b.sprintId === params.id) : []

  useEffect(() => {
    if (winner) {
      setShowConfetti(true)
      const t = setTimeout(() => setShowConfetti(false), 5000)
      return () => clearTimeout(t)
    }
  }, [winner])

  if (!sprint) return <div className="p-6 text-slate-400">Sprint not found.</div>

  if (!winner || !winnerUser) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <EmptyState
          icon="⚠️"
          title="No winner this sprint"
          description="No stories were completed on time. Better luck next sprint!"
          action={
            <Link href="/dashboard">
              <Button className="bg-indigo-600 hover:bg-indigo-700">Back to Dashboard</Button>
            </Link>
          }
        />
      </div>
    )
  }

  const rank2 = results.find(r => r.rank === 2)
  const rank3 = results.find(r => r.rank === 3)
  const user2 = rank2 ? getUserById(rank2.userId) : null
  const user3 = rank3 ? getUserById(rank3.userId) : null

  return (
    <div className="min-h-screen bg-[#0f1117] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-500/10 rounded-full blur-2xl" />
      </div>

      {/* Confetti particles */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-sm animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                backgroundColor: ['#6366f1', '#f59e0b', '#10b981', '#ec4899', '#3b82f6'][i % 5],
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${1 + Math.random()}s`,
              }}
            />
          ))}
        </div>
      )}

      <div className="relative z-10 w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <p className="text-slate-400 text-sm mb-1">{sprint.name}</p>
          <h1 className="text-3xl font-bold text-white">🎉 Sprint Complete!</h1>
        </div>

        {/* Winner card */}
        <div className="bg-gradient-to-b from-amber-500/10 to-[#13192a] border border-amber-500/30 rounded-3xl p-8 text-center mb-6 relative">
          <div className="absolute top-4 left-4 text-2xl">✨</div>
          <div className="absolute top-4 right-4 text-2xl">✨</div>

          <div className="text-sm font-semibold text-amber-400 tracking-wider uppercase mb-4">
            👑 Sprint MVP
          </div>

          <div className="flex justify-center mb-4">
            <div className="relative">
              <Avatar user={winnerUser} size="xl" className="ring-4 ring-amber-500/50" />
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-3xl">👑</div>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-white mb-1">{winnerUser.name}</h2>
          <p className="text-slate-400 text-sm mb-6 capitalize">{winnerUser.role}</p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-slate-800/60 rounded-xl p-3">
              <p className="text-2xl font-bold text-amber-400">{winner.pointsScored}</p>
              <p className="text-[10px] text-slate-500">points</p>
            </div>
            <div className="bg-slate-800/60 rounded-xl p-3">
              <p className="text-2xl font-bold text-green-400">{winner.storiesCompleted}</p>
              <p className="text-[10px] text-slate-500">stories</p>
            </div>
            <div className="bg-slate-800/60 rounded-xl p-3">
              <p className="text-2xl font-bold text-blue-400">{Math.round(winner.onTimeRate * 100)}%</p>
              <p className="text-[10px] text-slate-500">on time</p>
            </div>
          </div>

          {/* Badges earned */}
          {winnerBadges.length > 0 && (
            <div className="space-y-2">
              {winnerBadges.map(b => {
                const badge = BADGES.find(bd => bd.key === b.badgeKey)
                return badge ? (
                  <div key={b.id} className="flex items-center gap-2 bg-slate-800/40 rounded-lg px-3 py-2">
                    <span className="text-lg">{badge.icon}</span>
                    <div className="text-left">
                      <p className="text-xs font-semibold text-slate-200">{badge.name}</p>
                      <p className="text-[10px] text-slate-500">{badge.description}</p>
                    </div>
                  </div>
                ) : null
              })}
            </div>
          )}
        </div>

        {/* Runner ups */}
        {(rank2 || rank3) && (
          <div className="flex gap-3 mb-6">
            {rank2 && user2 && (
              <div className="flex-1 bg-[#13192a] border border-slate-700 rounded-xl p-3 text-center">
                <p className="text-lg mb-2">🥈</p>
                <Avatar user={user2} size="sm" className="mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-300 truncate">{user2.name}</p>
                <p className="text-xs text-slate-500">{rank2.pointsScored}pts</p>
              </div>
            )}
            {rank3 && user3 && (
              <div className="flex-1 bg-[#13192a] border border-slate-700 rounded-xl p-3 text-center">
                <p className="text-lg mb-2">🥉</p>
                <Avatar user={user3} size="sm" className="mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-300 truncate">{user3.name}</p>
                <p className="text-xs text-slate-500">{rank3.pointsScored}pts</p>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1 border-slate-700" onClick={() => window.print()}>
            <Share2 size={14} className="mr-1.5" /> Share
          </Button>
          <Link href="/dashboard" className="flex-1">
            <Button className="w-full bg-indigo-600 hover:bg-indigo-700">
              Dashboard <ArrowRight size={14} className="ml-1.5" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
