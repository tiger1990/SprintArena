'use client'
import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAppStore } from '@/store/app.store'
import { useCurrentUser } from '@/hooks'
import { Button } from '@/components/ui/button'
import { Flag, ArrowLeft, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { STATUS_LABELS } from '@/types'

export default function EndSprintPage() {
  const params = useParams()
  const router = useRouter()
  const { sprints, stories, endSprint, getUserById } = useAppStore()
  const { isAdmin, isHydrated } = useCurrentUser()
  const sprint = sprints.find(s => s.id === params.id)
  const [spillDecisions, setSpillDecisions] = useState<Record<string, 'spill' | 'backlog'>>({})

  if (!isHydrated) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!sprint || !isAdmin) {
    return <div className="p-6 text-slate-400">Not found or insufficient permissions.</div>
  }

  const incompleteStories = stories.filter(s =>
    s.sprintId === sprint.id && s.status !== 'done' && s.status !== 'spilled'
  )

  const handleEnd = () => {
    const spilledIds = Object.entries(spillDecisions)
      .filter(([_, d]) => d === 'spill')
      .map(([id]) => id)

    const { results } = endSprint(sprint.id, spilledIds)
    const winner = results.find(r => r.isWinner)

    toast.success('Sprint ended! Calculating results...')
    router.push(`/sprints/${sprint.id}/winner`)
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/board" className="text-slate-500 hover:text-slate-300">
          <ArrowLeft size={18} />
        </Link>
        <Flag size={22} className="text-red-400" />
        <h1 className="text-2xl font-bold text-white">End Sprint</h1>
      </div>

      {incompleteStories.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm mb-3">
            <AlertTriangle size={16} />
            {incompleteStories.length} stories are not complete
          </div>
          <div className="space-y-3">
            {incompleteStories.map(story => {
              const assignee = story.assigneeId ? getUserById(story.assigneeId) : null
              return (
                <div key={story.id} className="bg-[#13192a] border border-slate-800 rounded-lg p-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm text-slate-200 truncate">{story.title}</p>
                    <p className="text-xs text-slate-500">
                      {STATUS_LABELS[story.status]}{assignee ? ` · ${assignee.name}` : ''}
                    </p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => setSpillDecisions(prev => ({ ...prev, [story.id]: 'spill' }))}
                      className={`text-xs px-2 py-1 rounded-lg border transition-colors ${
                        spillDecisions[story.id] === 'spill'
                          ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                          : 'border-slate-700 text-slate-500'
                      }`}
                    >
                      Spill Over
                    </button>
                    <button
                      onClick={() => setSpillDecisions(prev => ({ ...prev, [story.id]: 'backlog' }))}
                      className={`text-xs px-2 py-1 rounded-lg border transition-colors ${
                        spillDecisions[story.id] === 'backlog'
                          ? 'bg-slate-600/40 border-slate-500 text-slate-300'
                          : 'border-slate-700 text-slate-500'
                      }`}
                    >
                      Back to Backlog
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="bg-[#13192a] border border-slate-800 rounded-xl p-5 mb-6">
        <h2 className="text-sm font-semibold text-white mb-2">What happens next?</h2>
        <ul className="space-y-1.5 text-xs text-slate-400">
          <li>• All stories are locked — no more moves</li>
          <li>• Sprint scores are calculated for all team members</li>
          <li>• Badges are awarded based on performance</li>
          <li>• Sprint MVP is announced to the whole team</li>
        </ul>
      </div>

      <Button
        className="w-full bg-red-600 hover:bg-red-700"
        onClick={handleEnd}
        data-testid="confirm-end-sprint-btn"
      >
        End Sprint & Calculate Results
      </Button>
    </div>
  )
}
