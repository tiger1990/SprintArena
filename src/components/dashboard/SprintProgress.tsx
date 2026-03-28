'use client'
import type { Sprint } from '@/types'
import { useAppStore } from '@/store/app.store'
import { sprintProgress, daysUntil, formatDate } from '@/lib/utils'
import { Progress } from '@/components/ui/progress'
import { Clock, Flag } from 'lucide-react'

export function SprintProgress({ sprint }: { sprint: Sprint }) {
  const { stories } = useAppStore()
  const sprintStories = stories.filter(s => s.sprintId === sprint.id)
  const done = sprintStories.filter(s => s.status === 'done').length
  const total = sprintStories.length
  const timeProgress = sprintProgress(sprint.startDate, sprint.endDate)
  const daysLeft = daysUntil(sprint.endDate)
  const storyPct = total > 0 ? Math.round((done / total) * 100) : 0

  const isAhead = storyPct >= timeProgress
  const statusColor = isAhead ? 'text-green-400' : 'text-amber-400'
  const statusLabel = isAhead ? 'On track' : 'Behind schedule'
  const statusBg = isAhead ? 'bg-green-500/10 border-green-500/20' : 'bg-amber-500/10 border-amber-500/20'

  return (
    <div className="bg-[#12151f] border border-slate-800/80 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800/60">
        <div className="flex items-center gap-2 min-w-0">
          <Flag size={14} className="text-indigo-400 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate leading-none">{sprint.name}</p>
            {sprint.goal && (
              <p className="text-[11px] text-slate-500 mt-0.5 truncate">{sprint.goal}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-4">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 border rounded-full text-[10px] font-semibold ${statusBg} ${statusColor}`}>
            {statusLabel}
          </span>
          <div className="flex items-center gap-1 text-[11px] text-slate-500">
            <Clock size={11} />
            <span>{daysLeft > 0 ? `${daysLeft}d left` : 'Ended'}</span>
          </div>
        </div>
      </div>

      {/* Progress rows */}
      <div className="px-5 py-4 space-y-4">
        {/* Stories */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">Stories completed</span>
              <span className="text-[10px] text-slate-600 bg-slate-800 px-1.5 py-0.5 rounded-full">{done}/{total}</span>
            </div>
            <span className="text-xs font-bold text-green-400">{storyPct}%</span>
          </div>
          <Progress value={storyPct} className="h-1.5 bg-slate-800 [&>div]:bg-green-500 [&>div]:transition-all" />
        </div>

        {/* Time */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">Time elapsed</span>
            </div>
            <span className="text-xs font-bold text-amber-400">{timeProgress}%</span>
          </div>
          <Progress value={timeProgress} className="h-1.5 bg-slate-800 [&>div]:bg-amber-500 [&>div]:transition-all" />
        </div>
      </div>

      {/* Footer dates */}
      <div className="flex justify-between px-5 py-3 border-t border-slate-800/40 bg-slate-900/20">
        <span className="text-[11px] text-slate-600">{formatDate(sprint.startDate)}</span>
        <span className="text-[11px] text-slate-600">{formatDate(sprint.endDate)}</span>
      </div>
    </div>
  )
}
