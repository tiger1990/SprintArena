'use client'
import { useAppStore } from '@/store/app.store'
import { useCurrentUser } from '@/hooks'
import { PriorityBadge } from '@/components/shared/PriorityBadge'
import { PointsBadge } from '@/components/shared/PointsBadge'
import { Avatar } from '@/components/shared/Avatar'
import { EmptyState } from '@/components/shared/EmptyState'
import { Button } from '@/components/ui/button'
import { FileText, Check, X } from 'lucide-react'
import { toast } from 'sonner'
import { useState } from 'react'

export default function ProposedPage() {
  const { getProposedStories, getUserById, approveProposal, rejectProposal } = useAppStore()
  const { user: currentUser, isAdmin, isHydrated } = useCurrentUser()
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [rejectNote, setRejectNote] = useState('')

  if (!isHydrated) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!currentUser || !isAdmin) {
    return <div className="p-6 text-slate-400">Admin access required.</div>
  }

  const stories = getProposedStories()

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <FileText size={22} className="text-indigo-400" />
        <div>
          <h1 className="text-2xl font-bold text-white">Proposed Stories</h1>
          <p className="text-slate-400 text-sm">{stories.length} awaiting your review</p>
        </div>
      </div>

      {stories.length === 0 ? (
        <EmptyState icon="✅" title="All caught up!" description="No proposed stories awaiting review." />
      ) : (
        <div className="space-y-4">
          {stories.map(story => {
            const creator = story.createdBy ? getUserById(story.createdBy) : null
            return (
              <div key={story.id} className="bg-[#13192a] border border-slate-800 rounded-xl p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <PriorityBadge priority={story.priority} />
                      <PointsBadge points={story.storyPoints} />
                    </div>
                    <h3 className="text-sm font-semibold text-slate-100 mb-1">{story.title}</h3>
                    <p className="text-xs text-slate-500 mb-3">{story.description}</p>
                    {story.acceptanceCriteria.length > 0 && (
                      <div className="space-y-1">
                        {story.acceptanceCriteria.map(ac => (
                          <p key={ac.id} className="text-xs text-slate-400">• {ac.text}</p>
                        ))}
                      </div>
                    )}
                    {creator && (
                      <div className="flex items-center gap-2 mt-3">
                        <Avatar user={creator} size="xs" />
                        <span className="text-xs text-slate-500">Proposed by {creator.name}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => { approveProposal(story.id, currentUser.id); toast.success('Story approved!') }}
                    >
                      <Check size={14} className="mr-1" /> Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                      onClick={() => setRejectingId(story.id)}
                    >
                      <X size={14} className="mr-1" /> Reject
                    </Button>
                  </div>
                </div>
                {rejectingId === story.id && (
                  <div className="mt-4 border-t border-slate-800 pt-4 flex gap-2">
                    <input
                      value={rejectNote}
                      onChange={e => setRejectNote(e.target.value)}
                      placeholder="Reason for rejection (optional)"
                      className="flex-1 text-xs bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-red-500/50 text-red-400"
                      onClick={() => {
                        rejectProposal(story.id, currentUser.id, rejectNote)
                        setRejectingId(null)
                        setRejectNote('')
                        toast.success('Story rejected')
                      }}
                    >
                      Confirm
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setRejectingId(null)}>Cancel</Button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
