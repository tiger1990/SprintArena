'use client'
import type { Story, StoryStatus } from '@/types'
import { useAppStore } from '@/store/app.store'
import { canEditStory, canMarkAcceptanceCriteria, canMoveToDone } from '@/lib/permissions'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { PriorityBadge } from '@/components/shared/PriorityBadge'
import { PointsBadge } from '@/components/shared/PointsBadge'
import { Avatar } from '@/components/shared/Avatar'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Check, Plus, AlertTriangle, MessageSquare, ChevronRight, CheckCircle2, X } from 'lucide-react'
import { useState } from 'react'
import { cn, formatRelativeTime } from '@/lib/utils'
import { STATUS_LABELS } from '@/types'
import { toast } from 'sonner'

const STATUS_STYLE: Record<string, { bg: string; text: string; dot: string }> = {
  todo:        { bg: 'bg-slate-700/60',    text: 'text-slate-300',  dot: 'bg-slate-400' },
  in_progress: { bg: 'bg-blue-500/15',     text: 'text-blue-400',   dot: 'bg-blue-400' },
  review:      { bg: 'bg-amber-500/15',    text: 'text-amber-400',  dot: 'bg-amber-400' },
  done:        { bg: 'bg-green-500/15',    text: 'text-green-400',  dot: 'bg-green-400' },
}

const NEXT_STATUS_LABEL: Partial<Record<StoryStatus, string>> = {
  todo:        'Move to In Progress',
  in_progress: 'Move to Review',
  review:      'Mark as Done',
}

export function StoryDetailSheet({ story, open, onClose }: { story: Story; open: boolean; onClose: () => void }) {
  const { currentUser, toggleAC, addAC, addComment, moveStory, getUserById } = useAppStore()
  const [newAC, setNewAC] = useState('')
  const [newComment, setNewComment] = useState('')
  const [isBlocker, setIsBlocker] = useState(false)

  const canEdit = currentUser ? canEditStory(currentUser, story) : false
  const canAC   = currentUser ? canMarkAcceptanceCriteria(currentUser, story) : false
  const canDone = currentUser ? canMoveToDone(currentUser) : false
  const assignee = story.assigneeId ? getUserById(story.assigneeId) : null

  const nextStatuses: Partial<Record<StoryStatus, StoryStatus>> = {
    todo: 'in_progress',
    in_progress: 'review',
    review: 'done',
  }
  const nextStatus = nextStatuses[story.status]
  const canMoveNext = nextStatus && (story.status !== 'review' || canDone)

  const statusStyle = STATUS_STYLE[story.status] ?? STATUS_STYLE.todo
  const metAC = story.acceptanceCriteria.filter(ac => ac.isMet).length
  const totalAC = story.acceptanceCriteria.length
  const acPct = totalAC > 0 ? Math.round((metAC / totalAC) * 100) : 0

  const handleAddAC = () => {
    if (!newAC.trim()) return
    addAC(story.id, newAC.trim())
    setNewAC('')
  }

  const handleAddComment = () => {
    if (!newComment.trim() || !currentUser) return
    addComment(story.id, currentUser.id, newComment.trim(), isBlocker)
    if (isBlocker) toast.warning('Blocker flagged. Admin has been notified.')
    setNewComment('')
    setIsBlocker(false)
  }

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent className="bg-[#0f1117] border-l border-slate-800 w-full sm:max-w-xl p-0 overflow-y-auto flex flex-col">

        {/* ── Header ─────────────────────────────────────────── */}
        <div className="bg-[#13192a] border-b border-slate-800 px-6 pt-6 pb-5">
          {/* Close + status row */}
          <div className="flex items-center justify-between mb-4">
            <span className={cn(
              'inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full',
              statusStyle.bg, statusStyle.text
            )}>
              <span className={cn('w-1.5 h-1.5 rounded-full', statusStyle.dot)} />
              {STATUS_LABELS[story.status]}
            </span>
            <button
              onClick={onClose}
              className="text-slate-500 hover:text-slate-300 transition-colors p-1 rounded-lg hover:bg-slate-800"
            >
              <X size={16} />
            </button>
          </div>

          {/* Title */}
          <h2 className="text-lg font-bold text-white leading-snug mb-4">{story.title}</h2>

          {/* Badges row */}
          <div className="flex items-center gap-2 flex-wrap">
            <PriorityBadge priority={story.priority} />
            <PointsBadge points={story.storyPoints} />
            {story.tags.slice(0, 3).map(tag => (
              <span key={tag} className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full border border-slate-700">
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* ── Body ───────────────────────────────────────────── */}
        <div className="flex-1 px-6 py-5 space-y-6">

          {/* Description */}
          {story.description && (
            <p className="text-sm text-slate-400 leading-relaxed">{story.description}</p>
          )}

          {/* Assignee */}
          {assignee && (
            <div className="flex items-center gap-3 bg-slate-800/40 border border-slate-800 rounded-xl px-4 py-3">
              <Avatar user={assignee} size="sm" />
              <div>
                <p className="text-xs font-semibold text-slate-200">{assignee.name}</p>
                <p className="text-[10px] text-slate-500 capitalize">{assignee.role}</p>
              </div>
              <span className="ml-auto text-[10px] text-slate-600 bg-slate-800 px-2 py-0.5 rounded-full">Assignee</span>
            </div>
          )}

          {/* Acceptance Criteria */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Acceptance Criteria
              </h3>
              <span className="text-[10px] text-slate-500">
                {metAC}/{totalAC}
                {totalAC > 0 && <span className="ml-1 text-slate-600">({acPct}%)</span>}
              </span>
            </div>

            {totalAC > 0 && (
              <div className="h-1 bg-slate-800 rounded-full overflow-hidden mb-3">
                <div
                  className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                  style={{ width: `${acPct}%` }}
                />
              </div>
            )}

            <div className="space-y-1.5">
              {story.acceptanceCriteria.map(ac => (
                <div
                  key={ac.id}
                  className={cn(
                    'flex items-start gap-3 px-3 py-2.5 rounded-lg transition-colors',
                    canAC ? 'cursor-pointer hover:bg-slate-800/60' : '',
                    ac.isMet ? 'bg-green-500/5' : 'bg-slate-800/30'
                  )}
                  onClick={() => canAC && currentUser && toggleAC(story.id, ac.id, currentUser.id)}
                >
                  <div className={cn(
                    'w-4 h-4 rounded flex items-center justify-center flex-shrink-0 mt-0.5 border transition-all',
                    ac.isMet ? 'bg-green-500 border-green-500' : 'border-slate-600'
                  )}>
                    {ac.isMet && <Check size={10} className="text-white" />}
                  </div>
                  <span className={cn('text-xs leading-relaxed', ac.isMet ? 'text-slate-500 line-through' : 'text-slate-300')}>
                    {ac.text}
                  </span>
                </div>
              ))}
            </div>

            {story.acceptanceCriteria.length === 0 && (
              <p className="text-xs text-slate-600 italic px-1">No acceptance criteria defined.</p>
            )}

            {canEdit && (
              <div className="flex gap-2 mt-3">
                <input
                  value={newAC}
                  onChange={e => setNewAC(e.target.value)}
                  placeholder="Add acceptance criterion..."
                  className="flex-1 text-xs bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                  onKeyDown={e => e.key === 'Enter' && handleAddAC()}
                />
                <button
                  onClick={handleAddAC}
                  className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                >
                  <Plus size={14} />
                </button>
              </div>
            )}
          </div>

          {/* Comments */}
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <MessageSquare size={11} />
              Comments
              {story.comments.length > 0 && (
                <span className="ml-1 bg-slate-800 text-slate-500 text-[10px] px-1.5 py-0.5 rounded-full">
                  {story.comments.length}
                </span>
              )}
            </h3>

            {story.comments.length > 0 && (
              <div className="space-y-2.5 mb-4">
                {story.comments.map(comment => {
                  const commenter = getUserById(comment.userId)
                  return (
                    <div
                      key={comment.id}
                      className={cn(
                        'p-3 rounded-xl border',
                        comment.isBlocker
                          ? 'bg-red-500/8 border-red-500/25'
                          : 'bg-slate-800/40 border-slate-800'
                      )}
                    >
                      {comment.isBlocker && (
                        <div className="flex items-center gap-1.5 text-red-400 text-[10px] font-bold mb-2 uppercase tracking-wider">
                          <AlertTriangle size={10} /> Blocker
                        </div>
                      )}
                      <p className="text-xs text-slate-300 leading-relaxed">{comment.body}</p>
                      <div className="flex items-center gap-2 mt-2">
                        {commenter && <Avatar user={commenter} size="xs" />}
                        <p className="text-[10px] text-slate-600">
                          {commenter?.name} · {formatRelativeTime(comment.createdAt)}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            <div className="space-y-2">
              <Textarea
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                placeholder="Leave a comment..."
                className="bg-slate-800/60 border-slate-700 text-sm resize-none placeholder:text-slate-600 focus:border-indigo-500"
                rows={2}
              />
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs text-slate-500 cursor-pointer select-none">
                  <div
                    className={cn(
                      'w-4 h-4 rounded border flex items-center justify-center transition-all cursor-pointer',
                      isBlocker ? 'bg-red-500 border-red-500' : 'border-slate-600'
                    )}
                    onClick={() => setIsBlocker(!isBlocker)}
                  >
                    {isBlocker && <Check size={10} className="text-white" />}
                  </div>
                  <AlertTriangle size={11} className="text-red-400" />
                  <span>Flag as blocker</span>
                </label>
                <Button
                  size="sm"
                  onClick={handleAddComment}
                  disabled={!newComment.trim()}
                  className="bg-indigo-600 hover:bg-indigo-700 text-xs px-4"
                >
                  Post
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Footer action ───────────────────────────────────── */}
        {currentUser && canMoveNext && nextStatus && (
          <div className="border-t border-slate-800 bg-[#13192a] px-6 py-4">
            {story.status === 'done' ? (
              <div className="flex items-center justify-center gap-2 text-green-400 text-sm font-semibold">
                <CheckCircle2 size={16} /> This story is complete
              </div>
            ) : (
              <Button
                className="w-full bg-indigo-600 hover:bg-indigo-700 h-10 font-semibold"
                onClick={() => { moveStory(story.id, nextStatus, currentUser.id); onClose() }}
              >
                {NEXT_STATUS_LABEL[story.status] ?? `Move to ${STATUS_LABELS[nextStatus]}`}
                <ChevronRight size={16} className="ml-1.5" />
              </Button>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
